# Chapter 7: Service Discovery

## The service object

Real service discovery in Kubernetes starts with a `Service object`.

A Service object is a way to create a named label selector. As we will see, the Service object does some other nice things for us, too. Just as the kubectl run command is an easy way to create a Kubernetes deployment, we can use `kubectl expose` to create a service.

```sh
kubectl create deployment alpaca-prod \
--image=gcr.io/kuar-demo/kuard-amd64:blue \
--replicas=3 \
--port=8080

kubectl expose deployment alpaca-prod

kubectl create deployment bandicot-prod \
--image=gcr.io/kuar-demo/kuard-amd64:blue \
--replicas=3 \
--port=8080

kubectl expose deployment bandicot-prod

kubectl get services -o wide
```

Furthermore, that service is assigned a new type of virtual IP called a `cluster IP`. This is a special IP address the system will load-balance across all of the Pods that are identified by the selector.

To interact with services, we are going to port forward to one of the alpaca Pods. Start and leave this command running in a terminal window.

```sh
ALPACA_POD=$(kubectl get pods -l app=alpaca-prod -o jsonpath='{.items[0].metadata.name}')
kubectl port-forward $ALPACA_POD 48858:8080
```

## Service DNS

Kubernetes provides a DNS service exposed to Pods running in the cluster. This Kubernetes DNS service was installed as a system component when the cluster was first created. The DNS service is, itself, managed by Kubernetes and is a great exam‐ ple of Kubernetes building on Kubernetes. The Kubernetes DNS service provides DNS names for cluster IPs.

The full DNS name here is `alpaca-prod.default.svc.cluster.local..` Let’s break this down:

- `alpaca-prod`: The name of the service in question.
- `default`: The namespace that this service is in.
- `svc`: Recognizing that this is a service. This allows Kubernetes to expose other types of things as DNS in the future.
- `cluster.local.` - The base domain name for the cluster. This is the default and what you will see for most clusters. Administrators may change this to allow unique DNS names across multiple clusters.

When referring to a service in your own namespace you can just use the service name (alpaca-prod). You can also refer to a service in another namespace with `alpaca-
prod.default`. And, of course, you can use the fully qualified service name (alpaca-prod.default.svc.cluster.local.). Try each of these out in the “DNS Query”
section of kuard.

## Readiness check

One nice thing the Service object does is track which of your Pods are ready via a `readiness check`. Let’s modify our deployment to add a readiness check that is attached to a Pod, as we discussed in Chapter 5:

```sh
kubectl edit deployment/alpaca-prod
```

This command will fetch the current version of the alpaca-prod deployment and bring it up in an editor. After you save and quit your editor, it’ll then write the object back to Kubernetes. This is a quick way to edit an object without saving it to a YAML file.

Add the following section:

```yaml
spec: ...
      template:
        ...
        spec:
          containers:
            ...
            name: alpaca-prod 
            readinessProbe:
              httpGet:
                path: /ready
                port: 8080
              periodSeconds: 2
              initialDelaySeconds: 0
              failureThreshold: 3
              successThreshold: 1
```

This sets up the Pods this deployment will create so that they will be checked for readiness via an `HTTP GET to /ready` on port 8080. This check is done every 2 seconds starting as soon as the Pod comes up. If three successive checks fail, then the Pod will be considered not ready. However, if only one check succeeds, the Pod will again be considered ready.

Only ready Pods are sent traffic. Updating the deployment definition like this will delete and recreate the alpaca Pods.

As such, we need to restart our port-forward command from earlier

In another terminal window, `start a watch command` on the endpoints for the alpaca-prod service. `Endpoints` are a lower-level way of finding what a service is sending traffic to and are covered later in this chapter. The `--watch` option here causes the kubectl command to hang around and output any updates. This is an easy way to see how a Kubernetes object changes over time:

```sh
kubectl get endpoints alpaca-prod --watch
```

This readiness check is a way for an overloaded or sick server to signal to the system that it doesn’t want to receive traffic anymore. This is a great way to implement `graceful shutdown`. The server can signal that it no longer wants traffic, wait until existing connections are closed, and then cleanly exit.

## Looking beyond the Cluster

Oftentimes, the IPs for Pods are only reachable from within the cluster. At some point, we have to allow new traffic in.

The most portable way to do this is to use a feature called `NodePorts`, which enhance a service even further. In addition to a cluster IP, the system picks a port (or the user can specify one), and every node in the cluster then forwards traffic to that port to the service.

Try this out by modifying the `alpaca-prod` service:

```sh
kubectl edit service alpaca-prod
```

Change the spec.type field to NodePort. You can also do this when creating the service via kubectl expose by specifying `--type=NodePort`. The system will assign a new NodePort. Check it with the following command:

```sh
kubectl describe service alpaca-prod
```

Now if you point your browser to `http://localhost:8080` you will be connected to that service. Each request that you send to the service will be randomly directed to one of the Pods that implements the service. Reload the page a few times and you will see that you are randomly assigned to different Pods.

## Cloud integration

If you have support from the cloud that you are running on (and your cluster is configured to take advantage of it), you can use the `LoadBalancer` type. This builds on the `NodePort` type by additionally configuring the cloud to create a new load balancer and direct it at nodes in your cluster.

Edit the `alpaca-prod` service again (kubectl edit service alpaca-prod) and change `spec.type` to `LoadBalancer`.

If you do a kubectl get services right away you’ll see that the `EXTERNAL-IP` column for `alpaca-prod` now says `<pending>`. Wait a bit and you should see a public address assigned by your cloud.

## Endpoints

Some applications (and the system itself) want to be able to use services without using a cluster IP. This is done with another type of object called an `Endpoints` object. For every Service object, Kubernetes creates a buddy Endpoints object that contains the IP addresses for that service:

```sh
kubectl describe endpoints alpaca-prod
```

To use a service, an advanced application can talk to the Kubernetes API directly to look up endpoints and call them. The Kubernetes API even has the capability to `“watch”` objects and be notified as soon as they change. In this way, a client can react immediately as soon as the IPs associated with a service change.

The `Endpoints object` is great if you are writing new code that is built to run on Kubernetes from the start. But most projects aren’t in this position! Most existing sys‐ tems are built to work with regular old IP addresses that don’t change that often.

## kube-proxy & cluster IPs

Cluster IPs are stable virtual IPs that load-balance traffic across all of the endpoints in a service. kube-proxy is a fundamental component of Kubernetes networking. It maintains the network rules that allow network communication to your Pods from network sessions inside or outside of your cluster.

### How kube-proxy Works

- `User-Space Mode`: Originally, `kube-proxy` used to operate in user-space mode. In this mode, `kube-proxy` itself would handle the traffic forwarding. If there's traffic that's meant for a Service, `kube-proxy` would forward it to one of the Service's backend Pods. This was simple but slow.
- `iptables Mode`: In this mode, kube-proxy watches the Kubernetes master for the addition and removal of Service and Endpoints objects. For each Service, it installs iptables rules which capture the traffic going to the Service's cluster IP and Port, and redirect that traffic to one of the Service's backend sets. For each `Endpoints` object, it installs iptables rules which select a backend Pod. `This is the default mode and is much faster than user-space mode.`
- `IPVS Mode`: Introduced as an alpha feature in Kubernetes 1.8, IPVS (IP Virtual Server) mode redirects traffic destined for Services' Cluster IPs to the correct backend. It provides better scalability and performance than iptables mode, especially in very large clusters.

![Kube proxy](/ch7_service-discovery/.pics/kube-proxy.png)
