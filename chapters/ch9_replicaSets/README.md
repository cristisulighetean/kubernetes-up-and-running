# Chapter 9: ReplicaSets

Benefits of running ReplicaSets:

- `Redundancy`: Multiple running instances mean failure can be tolerated.
- `Scale`: Multiple running instances mean that more requests can be handled.
- `Sharding`: Different replicas can handle different parts of a computation in parallel.

## Reconciliation Loops

The central concept behind a reconciliation loop is the notion of desired state versus observed or current state. Desired state is the state you want. With a `ReplicaSet`, it is the desired number of replicas and the definition of the Pod to replicate. For example, “the desired state is that there are three replicas of a Pod running the kuard server.”

The `reconciliation loop` is constantly running, observing the current state of the world and taking action to try to make the observed state match the desired state. For instance, with the previous examples, the `reconciliation loop` would create a new kuard Pod in an effort to make the observed state match the desired state of three replicas.

## Relating Pods and ReplicaSets

It’s important that all of the core concepts of Kubernetes are modular with respect to each other and that they are swappable and replaceable with other components. In this spirit, the relationship between ReplicaSets and Pods is loosely coupled.

## Quarantining containers

You can modify the set of labels on the sick Pod. Doing so will disassociate it from the ReplicaSet (and service) so that you can debug the Pod. The ReplicaSet con‐ troller will notice that a Pod is missing and create a new copy, but because the Pod is still running it is available to developers for interactive debugging, which is significantly more valuable than debugging from logs.

## Designing with ReplicaSets

ReplicaSets are designed for stateless (or nearly stateless) services. The elements created by the ReplicaSet are interchangeable; when a ReplicaSet is scaled down, an arbitrary Pod is selected for deletion. Your application’s behavior shouldn’t change because of such a scale-down operation.

## ReplicaSet Spec

Like all objects in Kubernetes, ReplicaSets are defined using a specification. All ReplicaSets must have a unique name (defined using the metadata.name field), a spec section that describes the number of Pods (replicas) that should be running cluster-wide at any given time, and a Pod template that describes the Pod to be created when the defined number of replicas is not met.

```sh
apiVersion: extensions/v1beta1
kind: ReplicaSet
metadata:
    name: kuard
spec:
    replicas: 1 template:
    metadata: 
        labels:
            app: kuard
            version: "2" 
    spec:
        containers:
            - name: kuard
                image: "gcr.io/kuar-demo kuard-amd64:green"
```

ReplicaSets are created by submitting a ReplicaSet object to the Kubernetes API. In this section we will create a ReplicaSet using a configuration file and the kubectl apply command.

```sh
kubectl apply -f kuard-rs.yaml
```

Inspecting ReplicaSets

```sh
kubectl describe rs kuard
```

## Scaling ReplicaSets

The easiest way to achieve `Imperative Scaling` is using the scale command in kubectl. For example, to scale up to four replicas you could run:

```sh
kubectl scale replicasets kuard --replicas=4
```

In the scenario where we need the change to persist, we must do a declarative change.

## Autoscaling ReplicaSets - Horizontal Pod Autoscaling (HPA)

HPA requires the presence of the heapster Pod on your cluster. heapster keeps track of metrics and provides an API for consum‐ ing metrics that HPA uses when making scaling decisions. Most installations of Kubernetes include heapster by default. You can validate its presence by listing the Pods in the kube-system namespace:

```sh
kubectl get pods --namespace=kube-system
```

You should see a Pod named heapster somewhere in that list. If you do not see it, autoscaling will not work correctly.

### Autoscaling based on CPU

Scaling based on CPU usage is the most common use case for Pod autoscaling. Gen‐ erally it is most useful for request-based systems that consume CPU proportionally to the number of requests they are receiving, while using a relatively static amount of memory.
To scale a ReplicaSet, you can run a command like the following:

```sh
kubectl autoscale rs kuard --min=2 --max=5 --cpu-percent=80
```

This command creates an autoscaler that scales between two and five replicas with a CPU threshold of 80%. To view, modify, or delete this resource you can use the standard kubectl commands and the `horizontalpodautoscalers` resource. horizontal podautoscalers is quite a bit to type, but it can be shortened to hpa:

```sh
kubectl get hpa
```

`Note`Because of the decoupled nature of Kubernetes, there is no direct link between the HPA and the ReplicaSet. While this is great for modularity and composition, it also enables some anti-patterns. In particular, it’s a bad idea to combine both autoscaling and imperative or declarative management of the number of replicas. If both you and an autoscaler are attempting to modify the number of replicas, it’s highly likely that you will clash, resulting in unexpected behavior.

## Deleting ReplicaSets

```sh
kubectl delete rs kuard
```

If you don’t want to delete the Pods that are being managed by the ReplicaSet, you can set the `--cascade` flag to false to ensure only the `ReplicaSet object` is deleted and not the Pods:

```sh
kubectl delete rs kuard --cascade=false
```
