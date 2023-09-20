# Chapter 14: Rule based access control

It’s important to remember that anyone who can run arbitrary code inside the Kubernetes cluster can effectively obtain root privileges on the entire cluster

Every `request` to Kubernetes is `first authenticated`. Authentication provides the identity of the caller issuing the request. It could be as simple as saying that the request is unauthenticated. Interestingly enough, Kubernetes does not have a built-in identity store, focusing instead on integrating other identity sources within itself.

Once users have been properly identified, the `authorization phase` determines whether they are authorized to perform the request. Authorization is a combination of the identity of the user, the resource (effectively the HTTP path), and the verb or action the user is attempting to perform. If the particular user is authorized for performing that action on that resource, then the request is allowed to proceed. Otherwise, an HTTP 403 error is returned. More details of this process are given in the following sections.

## Overview of RBAC

### Identity in Kubernetes

Every request that comes to Kubernetes is associated with some `identity`. Even a request with no identity is associated with the `system:unauthenticated` group.

Kubernetes makes a distinction between `user identities` and `service account identities`.

Kubernetes uses a generic interface for authentication providers. Each of the providers supplies a username and optionally the set of groups to which the user belongs.

## Understanding Roles and Role Bindings

- `role` is a set of abstract capabilities. For example, the appdev role might represent the ability to create Pods and services.
- `role binding` is an assignment of a role to one or more identities. Thus, binding the appdev role to the user identity alice indicates that Alice has the ability to create Pods and services.

## How do they work in Kubernetes

In Kubernetes there are two pairs of related resources that represent roles and role bindings.

1. One pair applies to just a `namespace` (Role and RoleBinding)
2. The other pair applies across the `cluster` (ClusterRole and ClusterRoleBinding).

Let’s examine Role and RoleBinding first. Role resources are namespaced, and represent capabilities within that single namespace. You `cannot` use namespaced roles for non-namespaced resources (e.g., CustomResourceDefinitions), and binding a Role Binding to a role only provides authorization within the Kubernetes namespace that contains both the Role and the RoleDefinition.

As a concrete example, here is a simple role that gives an identity the ability to create and modify Pods and services:

```yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: default
  name: pod-and-services
rules:
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["create", "delete", "get", "list", "patch", "update", "watch"]
```

To bind this Role to the user alice, we need to create a `RoleBinding` that looks as follows. This role binding also binds the group mydevs to the same role:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  namespace: default
  name: pod-and-services
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: User
  name: alice
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: mydevs
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: pod-and-services
```

Sometimes you want to create a role that applies to the entire cluster, or you want to limit access to cluster-level resources. To achieve this, you use the `ClusterRole` and `ClusterRoleBinding` resources. They are largely identical to their namespaced peers, but with larger scope.

### Verbs for K8s roles

The verbs correspond roughly to HTTP methods

![K8s RBAC Verbs](./.pics/k8s-roles.png)

## Built-in roles

There are also multiple built-in roles that can be checked out using the following command:

```sh
kubectl get clusterroles
```

While most of these built-in roles are for system utilities, four are designed for generic end users:

- The `cluster-admin` role provides complete access to the entire cluster.
- The `admin` role provides complete access to a complete namespace.
- The `edit` role allows an end user to modify things in a namespace.
- The `view` role allows for read-only access to a namespace.

## Techniques for Managing RBAC

### Testing Authorization with can-i

The first useful tool is the auth `can-i command` for kubectl. This tool is very useful for testing if a particular user can do a particular action. You can use can-i to validate configuration settings as you configure your cluster, or you can ask users to use the tool to validate their access when filing errors or bug reports.

In its simplest usage, the can-i command takes a verb and a resource.

For example, this command will indicate if the current kubectl user is authorized to create Pods:

```sh
kubectl auth can-i create pods
```

You can also test subresources like logs or port forwarding with the `--subresource` command-line flag:

```sh
kubectl auth can-i get pods --subresource=logs
```

## Managing RBAC in Source Control

The kubectl command-line tool comes with a reconcile command that operates somewhat like kubectl apply and will reconcile a text-based set of roles and role bindings with the current state of the cluster.

```sh
kubectl auth reconcile -f some-rbac-config.yaml
```

and the data in the file will be reconciled with the cluster. If you want to see changes before they are made, you can add the --dry-run flag to the command to print but not submit the changes.
