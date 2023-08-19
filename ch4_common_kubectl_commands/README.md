# Chapter 4: Common kubctl commands

## Namespaces

Kubernetes uses namespaces to organize objects in the cluster. You can think of each namespace as a folder that holds a set of objects.

By default, the kubectl cli tool interacts with the `default` namespace. If you want to use a different namespace, you can pass kubectl the `--namespace` flag. For example, `kubectl --namespace=mystuff` references objects in the mystuff namespace. If you want to interact with all namespaces—for example, to list all Pods in your cluster, you can pass the `--all-namespaces` flag.

## Context

If you want to change the default namespace more permanently, you can use a `context`. This gets recorded in a kubectl configuration file, usually located at `$HOME/.kube/config`. This configuration file also stores how to both find and authenticate to your cluster. For example, you can create a context with a different default namespace for your kubectl commands using:

```sh
kubectl config set-context my-context --namespace=mystuff
```

Then to use the context you run:

```sh
kubectl config use-context my-context
```

Contexts can also be used to manage different clusters or different users for authenticating to those clusters using the --users or --clusters flags with the set-context command.

## Viewing Kubernetes API Objects

Everything contained in Kubernetes is represented by a RESTful resource. Throughout this book, we refer to these resources as Kubernetes objects. Each Kubernetes object exists at a unique HTTP path; for example, `https://your-k8s.com/api/v1/namespaces/default/pods/my-pod` leads to the representation of a Pod in the default namespace named `my-pod`. The kubectl command makes HTTP requests to these URLs to access the Kubernetes objects that reside at these paths.

The most basic command for viewing Kubernetes objects via kubectl is get. If you run `kubectl get <resource-name>` you will get a listing of all resources in the cur‐ rent namespace. If you want to get a specific resource, you can use:

```sh
kubectl get <resource-name> <obj-name>
```

Additonal options:
- `-o wide/json/yaml` flag: gives more details

Another common task is extracting specific fields from the object. kubectl uses the JSONPath query language to select fields in the returned object. The complete details of JSONPath are beyond the scope of this chapter, but as an example, this command will extract and print the IP address of the specified Pod:

```sh
kubectl get pods my-pod -o jsonpath --template={.status.podIP}
```

If you are interested in more detailed information about a particular object, use the describe command:

```sh
kubectl describe <resource-name> <obj-name>
```

## Creating, Updating, and Destroying Kubernetes Objects

Objects in the Kubernetes API are represented as JSON or YAML files. These files are either returned by the server in response to a query or posted to the server as part of an API request. You can use these YAML or JSON files to create, update, or delete objects on the Kubernetes server.

Let’s assume that you have a simple object stored in obj.yaml. You can use kubectl to create this object in Kubernetes by running:

```sh
kubectl apply -f obj.yaml
```

Notice that you don’t need to specify the resource type of the object; it’s obtained from the object file itself.
Similarly, after you make changes to the object, you can use the apply command again to update the object:

```sh
kubectl apply -f obj.yaml
```

The apply tool will only modify objects that are different from the current objects in the cluster. If the objects you are creating already exist in the cluster, it will simply exit successfully without making any changes. This makes it useful for loops where you want to ensure the state of the cluster matches the state of the filesystem. You can repeatedly use apply to reconcile state.

If you want to see what the apply command will do without actually making the changes, you can use the `--dry-run` flag to print the objects to the terminal without actually sending them to the server.

If you feel like making `interactive edits` instead of editing a local file, you can instead use the edit command, which will download the latest object state and then launch an editor that contains the definition:

```sh
kubectl edit <resource-name> <obj-name>
```

After you save the file, it will be automatically uploaded back to the Kubernetes cluster.

The apply command also records the history of previous configurations in an anno‐ tation within the object. You can manipulate these records with the `edit-last-applied`, `set-last-applied`, and `view-last-applied` commands. For example:

```sh
kubectl apply -f myobj.yaml view-last-applied
```

will show you the last state that was applied to the object.

When you want to delete an object, you can simply run:

```sh
kubectl delete -f obj.yaml
```

It is important to note that kubectl will not prompt you to confirm the deletion. Once you issue the command, the object will be deleted.
Likewise, you can delete an object using the resource type and name:

```sh
kubectl delete <resource-name> <obj-name>
```

## Labeling and Annotating Objects

Labels and annotations are tags for your objects. We’ll discuss the differences in Chapter 6, but for now, you can update the labels and annotations on any Kubernetes object using the annotate and label commands.

For example, to add the color=red label to a Pod named bar, you can run:

```sh
kubectl label pods bar color=red 
```

The syntax for annotations is identical.

By default, label and annotate will not let you overwrite an existing label. To do this, you need to add the `--overwrite` flag.

If you want to remove a label, you can use the `<label-name>-` syntax:

```sh
kubectl label pods bar color-
```

This will remove the color label from the Pod named bar.

## Debugging commands

kubectl also makes a number of commands available for debugging your containers. You can use the following to see the logs for a running container:

```sh
kubectl logs <pod-name>
```

If you have multiple containers in your Pod, you can choose the container to view using the `-c` flag.

By default, kubectl logs lists the current logs and exits. If you instead want to continuously stream the logs back to the terminal without exiting, you can add the `-f` (follow) command-line flag.

You can also use the exec command to execute a command in a running container: 

```sh
kubectl exec -it <pod-name> -- bash
```

This will provide you with an interactive shell inside the running container so that you can perform more debugging.

If you don’t have bash or some other terminal available within your container, you can always attach to the running process:

```sh
kubectl attach -it <pod-name>
```

This will attach to the running process. It is similar to kubectl logs but will allow you to send input to the running process, assuming that process is set up to read from standard input.
You can also copy files to and from a container using the cp command:

```sh
kubectl cp <pod-name>:</path/to/remote/file> </path/to/local/file>
```

This will copy a file from a running container to your local machine. You can also specify directories, or reverse the syntax to copy a file from your local machine back out into the container.

If you want to access your Pod via the network, you can use the `port-forward` command to forward network traffic from the local machine to the Pod. This enables you to securely tunnel network traffic through to containers that might not be exposed anywhere on the public network. For example, the following command:

```sh
kubectl port-forward <pod-name> 8080:80
```

opens up a connection that forwards traffic from the local machine on port `8080` to the remote container on port `80`.

`Note`: You can also use the `port-forward` command with services by specifying `services/<service-name>` instead of `<pod-name>`, but note that if you do port-forward to a service, the requests will only ever be forwarded to a single Pod in that service. They will not go through the service load balancer.

Finally, if you are interested in how your cluster is using resources, you can use the top command to see the list of resources in use by either nodes or Pods. This command:

```sh
kubectl top nodes
```

will display the total CPU and memory in use by the nodes in terms of both absolute units (e.g., cores) and percentage of available resources (e.g., total number of cores). Similarly, this command:

```sh
kubectl top pods
```

will show all Pods and their resource usage. By default it only displays Pods in the current namespace, but you can add the --all-namespaces flag to see resource usage by all Pods in the cluster.
