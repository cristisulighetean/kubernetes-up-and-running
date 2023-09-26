# Chapter 15: Integrating Storage Solutions and Kubernetes

Integrating this data with containers and container orchestration solutions is often the most complicated aspect of building a distributed system.

This complexity largely stems from the fact that the move to containerized architectures is also a move toward decoupled, immutable, and declarative application development. These pat‐ terns are relatively easy to apply to stateless web applications, but even “cloud-native” storage solutions like Cassandra or MongoDB involve some sort of manual or imper‐ ative steps to set up a reliable, replicated solution.

This chapter covers a variety of approaches for integrating storage into containerized microservices in Kubernetes.

- First, we cover how to import existing `external storage solutions` (either cloud services or running on VMs) into Kubernetes.  
- Next, we explore how to run reliable singletons inside of Kubernetes that enable you to have an environment that largely matches the VMs where you previously deployed storage solutions.
- Finally, we cover `StatefulSets`, which are still under development but represent the future of stateful workloads in Kubernetes.

## Importing External Services

To see concretely how you maintain high fidelity between development and production, remember that all Kubernetes objects are deployed into `namespaces`. Imagine that we have test and production namespaces defined. The test service is imported using an object like:

```yaml
    kind: Service
    metadata:
      name: my-database
      # note 'test' namespace here
      namespace: test
```

The production service looks the same, except it uses a different namespace:

```yaml
    kind: Service
    metadata:
      name: my-database
      # note 'prod' namespace here
      namespace: prod
```

When you deploy a Pod into the test namespace and it looks up the service named my-database, it will receive a pointer to `my-database.test.svc.cluster.internal`, which in turn points to the test database. In contrast, when a Pod deployed in the prod namespace looks up the same name (my-database) it will receive a pointer to `my-database.prod.svc.cluster.internal`, which is the production database. Thus, the same service name, in two different namespaces, resolves to two different services.

## Services without selectors

When we first introduced services, we talked at length about label queries and how they were used to identify the dynamic set of Pods that were the backends for a particular service. 

With external services, however, there is no such label query. Instead, you generally have a DNS name that points to the specific server running the database. For our example, let’s assume that this server is named `database.company.com`. To import this external database service into Kubernetes, we start by creating a service without a Pod selector that references the DNS name of the database server.

```yaml
kind: Service
apiVersion: v1 
metadata:
    name: external-database
spec:
    type: ExternalName
    externalName: database.company.com
```

When a typical Kubernetes service is created, an IP address is also created and the `Kubernetes DNS service` is populated with an A record that points to that IP address. When you create a service of type `ExternalName`, the Kubernetes DNS service is instead populated with a `CNAME record` that points to the external name you specified (database.company.com in this case). 

When an application in the cluster does a `DNS lookup` for the hostname `external-database.svc.default.cluster`, the DNS protocol aliases that name to `database.company.com`. This then resolves to the IP address of your external database server. In this way, all containers in Kubernetes believe that they are talking to a service that is backed with other containers, when in fact they are being redirected to the external database.

Sometimes, however, you `don’t have a DNS address for an external database service`, just an IP address. In such cases, it is still possible to import this service as a Kubernetes service, but the operation is a little different. First, you create a Service without a label selector, but also without the ExternalName type we used before.

```yaml
kind: Service
apiVersion: v1
metadata:
    name: external-ip-database
```

At this point, Kubernetes will allocate a virtual IP address for this service and populate an A record for it. However, because there is no selector for the service, there will be no endpoints populated for the load balancer to redirect traffic to.
Given that this is an external service, the user is responsible for populating the endpoints manually with an Endpoints resource.

```yaml
kind: Endpoints
apiVersion: v1
metadata:
    name: external-ip-database
subsets:
  - addresses:
    - ip: 192.168.0.1 
  - ports:
    - port: 3306
```

If you have more than one IP address for redundancy, you can repeat them in the addresses array. Once the endpoints are populated, the load balancer will start redi‐ recting traffic from your Kubernetes service to the IP address endpoint(s).

### Limitations of External Services: Health Checking

External services in Kubernetes have one significant restriction: they do not perform any health checking. The user is responsible for ensuring that the endpoint or DNS name supplied to Kubernetes is as reliable as necessary for the application.

## Running Reliable Singletons

### Running a MySQL Singleton

To do this, we are going to create three basic objects:

- A persistent volume to manage the lifespan of the on-disk storage independently from the lifespan of the running MySQL application
- A MySQL Pod that will run the MySQL application
- A service that will expose this Pod to other containers in the cluster

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
    name: database
    labels:
        volume: my-volume 
spec:
    accessModes:
    - ReadWriteMany
    capacity:
        storage: 1Gi
    nfs:
        server: 192.168.0.1
        path: "/exports"
```

Now that we have a persistent volume created, we need to claim that persistent volume for our Pod. We do this with a `PersistentVolumeClaim` object.

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
    name: database
spec:
    accessModes:
    - ReadWriteMany
    resources:
        requests:
            storage: 1Gi
    selector: 
        matchLabels:
            volume: my-volume
```

This kind of indirection may seem overly complicated, but it has a purpose—it serves to isolate our Pod definition from our storage definition. You can declare volumes directly inside a Pod specification, but this locks that Pod specification to a particular volume provider (e.g., a specific public or private cloud). By using volume claims, you can keep your Pod specifications cloud-agnostic; simply create different volumes, specific to the cloud, and use a PersistentVolumeClaim to bind them together. Furthermore, in many cases, the persistent volume controller will actually automatically create a volume for you.

Now that we’ve claimed our volume, we can use a ReplicaSet to construct our single‐ ton Pod. It might seem odd that we are using a ReplicaSet to manage a single Pod, but it is necessary for reliability. Remember that once scheduled to a machine, a bare Pod is bound to that machine forever. If the machine fails, then any Pods that are on that machine that are not being managed by a higher-level controller like a ReplicaSet vanish along with the machine and are not rescheduled elsewhere. Consequently, to ensure that our database Pod is rescheduled in the presence of machine failures, we use the higher-level ReplicaSet controller, with a replica size of one, to manage our database.

```yaml
apiVersion: extensions/v1
kind: ReplicaSet
metadata:
    name: mysql
    # labels so that we can bind a Service to this Pod
    labels: 
        app: mysql
spec:
    replicas: 1
    selector:
        matchLabels:
            app: mysql
    template:
        metadata:
            labels:
                app: mysql
        spec:
            containers:
            - name: database
                image: mysql
                resources:
                    requests: 
                        cpu: 1
                        memory: 2Gi
                env:
                # Environment variables are not a best practice for security, 
                # but we're using them here for brevity in the example.
                # See Chapter 11 for better options.
                - name: MYSQL_ROOT_PASSWORD
                    value: some-password-here
                livenessProbe:
                    tcpSocket:
                        port: 3306
                ports:
                    - containerPort: 3306
                    volumeMounts:
                        - name: database
                        # /var/lib/mysql is where MySQL stores its databases
                        mountPath: "/var/lib/mysql"
            volumes:
            - name: database
                persistentVolumeClaim: 
                    claimName: database

```

Once we create the `ReplicaSet` it will, in turn, create a Pod running MySQL using the persistent disk we originally created. The final step is to expose this as a Kubernetes service.

```yaml
apiVersion: v1
kind: Service
metadata:
    name: mysql
spec:
    ports:
    - port: 3306
    protocol: TCP
    selector:
        app: mysql
```

Now we have a reliable singleton MySQL instance running in our cluster and exposed as a service named mysql, which we can access at the full domain name `mysql.svc.default.cluster`.

## Dynamic Volume Provisioning

Many clusters also include dynamic volume provisioning. With dynamic volume provisioning, the cluster operator creates one or more `StorageClass` objects. The following example shows a default storage class that automatically provisions disk objects on the Microsoft Azure platform.

```yaml
apiVersion: storage.k8s.io/v1 
kind: StorageClass
metadata:
    name: default 
    annotations:
        storageclass.beta.kubernetes.io/is-default-class: "true" 
    labels:
        kubernetes.io/cluster-service: "true" 
provisioner: kubernetes.io/azure-disk
```

Once a storage class has been created for a cluster, you can refer to this storage class in your persistent volume claim, rather than referring to any specific persistent volume. When the dynamic provisioner sees this storage claim, it uses the appropriate volume driver to create the volume and bind it to your persistent volume claim.

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
    name: my-claim
    annotations:
        volume.beta.kubernetes.io/storage-class: default
spec:
    accessModes:
    - ReadWriteOnce
    resources:
        requests: 
        storage: 10Gi
```