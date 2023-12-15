# Chapter 11: DaemonSets

A `DaemonSet` ensures a copy of a Pod is running across a set of nodes in a Kubernetes cluster. `DaemonSets` are used to deploy system daemons such as log collectors and monitoring agents, which typically must run on every node.

DaemonSets share similar functionality with ReplicaSets; both create Pods that are expected to be long-running services and ensure that the desired state and the observed state of the cluster match.

Given the similarities between DaemonSets and ReplicaSets, it’s important to understand when to use one over the other.

- `ReplicaSets` should be used when your application is completely decoupled from the node and you can run multiple copies on a given node without special consideration.
- `DaemonSets` should be used when a single copy of your application must run on all or a subset of the nodes in the cluster.

`Note`:  If you find yourself wanting a single Pod per node, then a `DaemonSet` is the correct Kubernetes resource to use. Likewise, if you find yourself building a homogeneous replicated service to serve user traffic, then a `ReplicaSet` is probably the right Kubernetes resource to use.

## DeamonSet Scheduler

By default a DaemonSet will create a copy of a Pod on every node unless a node selector is used, which will limit eligible nodes to those with a matching set of labels. DaemonSets determine which node a Pod will run on at Pod creation time by specifying the nodeName field in the Pod spec. As a result, Pods created by DaemonSets are ignored by the Kubernetes scheduler.

## Creating DeamonSets

DaemonSets are created by submitting a DaemonSet configuration to the Kubernetes API server. The DaemonSet in the following example will create a fluentd logging agent on every node in the target cluster.

```yaml
apiVersion: extensions/v1beta1
kind: DaemonSet
metadata:
  name: fluentd 
  labels:
    app: fluentd
spec:
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      containers:
      - name: fluentd
        image: fluent/fluentd:v0.14.10
        resources:
          limits: 
            memory: 200Mi
          requests:
            cpu: 100m
            memory: 200Mi
        volumeMounts: 
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true 
        terminationGracePeriodSeconds: 30 
      volumes:
        - name: varlog
        hostPath:
          path: /var/log
        - name: varlibdockercontainers
          hostPath:
            path: /var/lib/docker/containers
```

DaemonSets require a unique name across all DaemonSets in a given Kubernetes namespace. Each `DaemonSet` must include a `Pod` template spec, which will be used to create Pods as needed. This is where the similarities between `ReplicaSets` and `DaemonSets` end.

Unlike `ReplicaSets`, `DaemonSets` will create `Pods` on every node in the cluster by default unless a node selector is used.

Create and check the `DaemonSet`

```sh
kubectl describe daemonset fluentd

kubectl describe daemonset fluentd
```

## Limiting DaemonSets to Specific Nodes

The most common use case for `DaemonSets` is to run a `Pod` across every node in a `Kubernetes` cluster. However, there are some cases where you want to deploy a `Pod` to only a subset of nodes. For example, maybe you have a workload that requires a GPU or access to fast storage only available on a subset of nodes in your cluster. In cases like these, `node labels` can be used to tag specific nodes that meet workload requirements.

## Adding Labels to Nodes

The first step in limiting DaemonSets to specific nodes is to add the desired set of labels to a subset of nodes. This can be achieved using the `kubectl label` command.

The following command adds the `ssd=true` label to a single node:

```sh
kubectl label nodes k0-default-pool-35609c18-z7tb ssd=true
```

Select nodes based on that label

```sh
kubectl get nodes --selector ssd=true
```

## Node Selectors

Node selectors can be used to limit what nodes a Pod can run on in a given Kubernetes cluster. `Node selectors` are defined as part of the Pod spec when creating a `DaemonSet`. The `DaemonSet` configuration in following example limits `NGINX` to running only on nodes with the `ssd=true label set`.

```yaml
apiVersion: extensions/v1beta1
kind: "DaemonSet"
metadata:
  labels:
    app: nginx
    ssd: "true"
  name: nginx-fast-storage
spec:
  template:
    metadata:
      labels:
        app: nginx
        ssd: "true"
    spec:
      nodeSelector:
        ssd: "true"
      containers:
        - name: nginx
          image: nginx:1.10.0
```

### Rolling update of a DaemonSet

`DaemonSets` can be rolled out using the same `RollingUpdate` strategy that deployments use. You can configure the update strategy using the `spec.updateStrategy.type` field, which should have the value `RollingUpdate`. When a `DaemonSet` has an update strategy of `RollingUpdate`, any change to the `spec.template` field (or subfields) in the DaemonSet will initiate a rolling update.

## Deleting a DaemonSet

```sh
kubectl delete -f fluentd.yaml
```