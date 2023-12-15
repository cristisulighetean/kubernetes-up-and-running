# Kubernetes cheatsheet

We use `kubectl` to interact with the Kubernetes Cluster

```sh
# Displays the health status of the core components of the Kubernetes cluster
kubectl get componentstatuses
kubectl get cs

# Get the nodes
kubectl get nodes

# Describe one of the nodes
kubectl describe nodes node-1
```

## Namespaces

```sh
# Create new namespace
kubectl create namespace mynamespace

# Get deployments from kubectl kube-system
kubectl get deployments --namespace=kube-system
```

## Context

```sh
# Create a context
kubectl config set-context my-context --namespace=mynamespace

# Use the context
kubectl config use-context my-context 
```