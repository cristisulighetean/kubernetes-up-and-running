# Chapter 5: Pods

A canonical example of how to containarize an application is illustrated below, which consists of a container serving web requests and a container synchronizing the filesystem with a remote Git repository.

![Example pod](./.pics/example-pod.png)

At first, it might seem tempting to wrap up both the web server and the Git synchronizer into a single container. After closer inspection, however, the reasons for the separation become clear. First, the two different containers have significantly different requirements in terms of resource usage. Take, for example, memory. Because the web server is serving user requests, we want to ensure that it is always available and responsive. On the other hand, the Git synchronizer isn’t really user-facing and has a “best effort” quality of service.

Suppose that our Git synchronizer has a memory leak. We need to ensure that the Git synchronizer cannot use up memory that we want to use for our web server, since this can affect web server performance or even crash the server.

This sort of resource isolation is exactly the sort of thing that containers are designed to accomplish. By separating the two applications into two separate containers, we can ensure reliable web server operation.
Of course, the two containers are quite symbiotic; it makes no sense to schedule the web server on one machine and the Git synchronizer on another. Consequently, Kubernetes groups multiple containers into a single atomic unit called a Pod.

## Pods in Kubernetes

A Pod represents a collection of application containers and volumes running in the same execution environment. Pods, not containers, are the smallest deployable artifact in a Kubernetes cluster. This means all of the containers in a Pod always land on the same machine.

Each container within a Pod runs in its own cgroup, but they share a number of Linux namespaces.

`Important:` Applications running in the same Pod share the same IP address and port space (net‐ work namespace), have the same hostname (UTS namespace), and can communicate using native interprocess communication channels over System V IPC or POSIX message queues (IPC namespace). However, applications in different Pods are iso‐ lated from each other; they have different IP addresses, different hostnames, and more. Containers in different Pods running on the same node might as well be on different servers.

## Thinking with Pods

Sometimes people see Pods and think, “Aha! A WordPress container and a MySQL database container should be in the same Pod.” However, this kind of Pod is actually an example of an `anti-pattern` for Pod construction. 

There are two reasons for this. First, WordPress and its database are not truly symbiotic. If the WordPress container and the database container land on different machines, they still can work together quite effectively, since they communicate over a network connection. Secondly, you don’t necessarily want to scale WordPress and the database as a unit. WordPress itself is mostly stateless, and thus you may want to scale your WordPress frontends in response to frontend load by creating more WordPress Pods. Scaling a MySQL data‐ base is much trickier, and you would be much more likely to increase the resources dedicated to a single MySQL Pod. If you group the WordPress and MySQL containers together in a single Pod, you are forced to use the same scaling strategy for both con‐ tainers, which doesn’t fit well.

In general, the right question to ask yourself when designing Pods is, “Will these con‐ tainers work correctly if they land on different machines?” If the answer is “no,” a Pod is the correct grouping for the containers. If the answer is “yes,” multiple Pods is probably the correct solution. In the example at the beginning of this chapter, the two containers interact via a local filesystem. It would be impossible for them to operate correctly if the containers were scheduled on different machines.

## The Pod Manifest

Pods are described in a `Pod manifest`. The Pod manifest is just a text-file representation of the Kubernetes API object. Kubernetes strongly believes in declarative configuration. Declarative configuration means that you write down the desired state of the world in a configuration and then submit that configuration to a service that takes actions to ensure the desired state becomes the actual state.

## Creating a pod

The simplest way to create a Pod is via the imperative kubectl run command. For example, to run our same kuard server, use:

```sh
kubectl run kuard --generator=run-pod/v1 \ --image=gcr.io/kuar-demo/kuard-amd64:blue
```

You can see the status of this Pod by running:

```sh
kubectl get pods
```

You may initially see the container as Pending, but eventually you will see it transition to Running, which means that the Pod and its containers have been successfully created.

For now, you can delete this Pod by running:

```sh
kubectl delete pods/kuard
```

We will now move on to writing a complete Pod manifest by hand.

## Creating a Pod manifest

Pod manifests include a couple of key fields and attributes: namely a metadata section for describing the Pod and its labels, a spec section for describing volumes, and a list of containers that will run in the Pod.

```yaml
apiVersion: v1
kind: Pod 
metadata:
  name: kuard
spec:
  containers:
    - image: gcr.io/kuar-demo/kuard-amd64:blue
      name: kuard
      ports:
        - containerPort: 8080
          name: http
          protocol: TCP
```

### Commands to work with

```sh
# Creating the pod
kubectl apply -f kuard-pod.yaml

# Listing the pods
kubectl list

# Find more information about a pod
kubectl describe pods kuard

# Deleting a pod
kubectl delete pods/kuard

# Deleting a pod using the file we used to create it
kubectl delete -f kuard-pod.yaml
```

By default, the kubectl command-line tool tries to be concise in the information it reports, but you can get more information via command-line flags. Adding -o wide to any kubectl command will print out slightly more information (while still trying to keep the information to a single line). Adding -o json or -o yaml will print out the complete objects in JSON or YAML, respectively.

### Deleting a pod

When a Pod is deleted, it is not immediately killed. Instead, if you run kubectl get pods you will see that the Pod is in the `Terminating state`. All Pods have a termina‐ tion grace period. By default, this is 30 seconds. When a Pod is transitioned to `Terminating` it no longer receives new requests. In a serving scenario, the grace period is important for reliability because it allows the Pod to finish any active requests that it may be in the middle of processing before it is terminated.

It’s important to note that when you delete a Pod, any data stored in the containers associated with that Pod will be deleted as well. If you want to persist data across multiple instances of a Pod, you need to use `PersistentVolumes`, described at the end of this chapter.

## Accessing the Pod

```sh
# Using port forwarding
kubectl port-forward kuard 8080:8080

# Getting more information with logs
kubctl logs kuard
# Adding the -f flag will cause you to continuously stream logs.

```

### Accessing logs

- Adding the `-f` flag will cause you to continuously stream logs.
- Adding the `--previous` flag will get logs from a previous instance of the container. This is useful, for example, if your containers are continuously restarting due to a problem at container startup.

### Running commands in the container

```sh
kubectl exec kuard date

#Gget an interactive session by adding the -it flags
kubectl exec -it  kuard ash
```

The command `kubectl exec -it kuard ash` opens an interactive shell session (ash) inside the container of the pod named "kuard." This is commonly used for debugging or managing files directly inside the container.

### Copying Files to and from Containers

```sh
kubectl cp <pod-name>:/captures/capture3.txt ./capture3.txt

kubectl cp $HOME/config.txt <pod-name>:/config.txt
```

Generally speaking, copying files into a container is an `anti-pattern`. You really should treat the contents of a container as `immutable`. But occasionally it’s the most immedi‐ ate way to stop the bleeding and restore your service to health, since it is quicker than building, pushing, and rolling out a new image. Once the bleeding is stopped, however, it is critically important that you immediately go and do the image build and rollout, or you are guaranteed to forget the local change that you made to your con‐ tainer and overwrite it in the subsequent regularly scheduled rollout.

## Health checks

When you run your application as a container in Kubernetes, it is automatically kept alive for you using a process health check. This health check simply ensures that the main process of your application is always running. If it isn’t, Kubernetes restarts it.

### Liveness probe

Liveness health checks run application-specific logic (e.g., loading a web page) to verify that the application is not just still running, but is functioning properly. Since these liveness health checks are application-specific, you have to define them in your Pod manifest.

Once the kuard process is up and running, we need a way to confirm that it is actually healthy and shouldn’t be restarted. Liveness probes are defined per container, which means each container inside a Pod is health-checked separately. In our example we add a `liveness probe` to our kuard container, which runs an HTTP request against the `/healthy` path on our container.

```yaml
apiVersion: v1
kind: Pod 
metadata:
  name: kuard
spec:
  containers:
    - image: gcr.io/kuar-demo/kuard-amd64:blue
      name: kuard
      livenessProbe:
        httpGet:
          path: /healthy
          port: 8080
        initialDelaySeconds: 5
        timeoutSeconds: 1
        periodSeconds: 10
        failureThreshold: 3
      ports:
        - containerPort: 8080
          name: http
          protocol: TCP
```

- The preceding Pod manifest uses an httpGet probe to perform an HTTP GET request against the `/healthy`endpoint on port 8080 of the kuard container. 
- The probe sets an `initialDelaySeconds` of 5, and thus will not be called until 5 seconds after all the containers in the Pod are created.
- The probe must respond within the 1-second `timeout`, and the HTTP status code must be equal to or greater than 200 and less than 400 to be considered successful. 
- Kubernetes will call the probe every 10 seconds. If more than three consecutive probes fail, `the container will fail and restart.`

### Rediness probe

### Types of health checks

## Resource management

### Resource Requests: Minimum Required Resources

### Capping Resource Usage with Limits

## Persisting Data with Volumes

### Using Volumes with Pods

### Different Ways of Using Volumes with Pods

### Persisting Data Using Remote Disks

## Putting It All Together