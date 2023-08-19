# Chapter 3: Deploying a K8s cluster

## Installing Kubernetes on a Public Cloud Provider

### Google Kubernetes Engine(GKE)

Using the gcloud cli tool

```sh
# Set a default zone
gcloud config set compute/zone us-west1-a

# Create a cluster
gcloud container clusters create kuar-cluster

# Login into the cluster
gcloud auth application-default login
```

### Azure Kubernetes Service (AKS)

Using the az cli tool

```sh
# Create resource group
az group create --name=kuar --location=westus

# Create cluster
az aks create --resource-group=kuar --name=kuar-cluster

# Login into the cluster
az aks get-credentials --resource-group=kuar --name=kuar-cluster

# Install kubectl tool
az aks install-cli
```

Note: Look up the [official doc](https://learn.microsoft.com/en-us/azure/aks/learn/quick-kubernetes-deploy-cli) for the complete install instructions

### Elastic Kubernetes Service (EKS)

Using the open-source eksctl cli tool

```sh
eksctl create cluster --name kuar-cluster ...

# To get help
eksctl create cluster --help
```

## Installing K8s locally using minikube

While minikube (or Docker Desktop) is a good simulation of a Kubernetes cluster, it’s really intended for local development, learning, and experimentation. Because it only runs in a VM on a single node, it doesn’t provide the reliability of a distributed Kubernetes cluster.

```sh
# Create local cluster
minikube start

# Stop the cluster
minikube stop

# Delete the cluster
minikube delete
```

## The Kubernetes client

The official Kubernetes client is kubectl: a command-line tool for interacting with the Kubernetes API. kubectl can be used to manage most Kubernetes objects, such as Pods, ReplicaSets, and Services. kubectl can also be used to explore and verify the overall health of the cluster.

```sh
# Checking Kubectl and API server version
kubectl version

# Get simple diagnostic
kubectl get componentstatuses

# Listinh K8s worker nodes
kubectl get nodes

# Get more info about a specific node
kubectl describe nodes node-1
```



### Kubernetes nodes

- In Kubernetes, nodes are separated into `master nodes` that contain containers like the API server, scheduler, etc., which manage the cluster, and `worker nodes` where your containers will run.
- Kubernetes won’t generally schedule work onto master nodes to ensure that user workloads don’t harm the overall operation of the cluster.

Other components

The `controller-manager` is responsible for running various controllers that regulate behavior in the cluster; for example, ensuring that all of the replicas of a service are available and healthy. The `scheduler` is responsible for placing different `Pods` onto different `nodes` in the cluster. Finally, the `etcd server` is the storage for the cluster where all of the API objects are stored.

## Cluster components

All of these components run in the `kube-system namespace`.

### Kubernetes Proxy, DNS & Dashboard

```sh
# Get Kubernetes Proxy
kubectl get daemonSets --namespace=kube-system kube-proxy

# Get DNS
kubectl get deployments --namespace=kube-system core-dns

# Get the LB service for the DNS server
kubectl get services --namespace=kube-system core-dns

# UI
kubectl get deployments --namespace=kube-system kubernetes-dashboard

# It also has a service that performs LB for the dashboard
kubectl get services --namespace=kube-system kubernetes-dashboard

# Lunch the UI
kubectl proxy
```

Some providers do not come with K8s dashboard by default.
