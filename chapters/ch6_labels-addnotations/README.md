# Chapter 6: Labels and Addnotations

## Labels

`Labels` are `key/value pairs` that can be attached to Kubernetes objects such as `Pods` and `ReplicaSets`. They can be arbitrary, and are useful for attaching identifying information to Kubernetes objects. Labels provide the foundation for grouping objects.

Label keys can be broken down into two parts: an optional prefix and a name, separated by a slash. The prefix, if specified, must be a DNS subdomain with a 253-character limit. The key name is required and must be shorter than 63 characters. Names must also start and end with an alphanumeric character and permit the use of dashes (-), underscores (_), and dots (.) between characters.

### Label examples

| Key                           | Value |
|-------------------------------|-------|
| acme.com/app-version          | 1.0.0 |
| appVersion                    | 1.0.0 |
| app.version                   | 1.0.0 |
| kubernetes.io/cluster-service | true  |

### Applying labels

Create a deployment (can not add labels out here):

```sh
kubectl create deployment alpaca-int \
--image=gcr.io/kuar-demo/kuard-amd64:blue \
--replicas=2
```

Now check the labels:

```sh
kubectl get deployments --show-labels
```

You can also modify them (can only add one at a time):

```sh
kubectl label deployments alpaca-prod "env=test"
```

Show a label value as a column:

```sh
kubectl get deployments -L canary
```

Remove a label (by applying a dash suffix):

```sh
kubectl label deployments alpaca-test "canary-"
```

### Label selectors

Label selectors are used to filter Kubernetes objects based on a set of labels. Selectors use a simple `Boolean language`. They are used both by end users (via tools like kubectl) and by different types of objects (such as how a ReplicaSet relates to its Pods).

```sh
kubectl get pods --selector="ver=2"
```

Specify if an app label is a set to alpaca or bandicot

```sh
kubectl get pods --selector="app in (alpaca,bandicoot)"
```

Ask for all deployments which have the canary label

```sh
kubectl get deployments --selector="canary"

# Or not
kubectl get deployments --selector="!canary"

# Or add them with other checks
kubectl get deployments --selector="!canary,ver=2"
```

### Label selectors in API objects

```yaml
selector:
    matchLabels:
        app: alpaca
        matchExpressions:
            - {key: ver, operator: In, values: [1, 2, 3]}

```

## Addnotations (good way of storing metadata)

`Annotations`, on the other hand, provide a storage mechanism that resembles labels: annotations are key/value pairs designed to hold nonidentifying information that can be leveraged by tools and libraries.

While labels are used to identify and group objects, annotations are used to provide extra information about where an object came from, how to use it, or policy around that object.

Annotations are used to:

- Keep track of a `reason` for the latest update to an object.
- Communicate a specialized scheduling policy to a specialized scheduler.
- Extend data about the last tool to update the resource and how it was updated (used for detecting changes by other tools and doing a smart merge).
- Attach build, release, or image information that isn’t appropriate for labels (may include a Git hash, timestamp, PR number, etc.).
- Enable the `Deployment object` (Chapter 10) to keep track of `ReplicaSets` that it is managing for rollouts.
- Provide extra data to enhance the visual quality or usability of a UI. For example, objects could include a link to an icon (or a base64-encoded version of an icon).
- Prototype alpha functionality in Kubernetes (instead of creating a first-class API field, the parameters for that functionality are encoded in an annotation).

### Defining addnotations

The value component of an annotation is a free-form string field. While this allows maximum flexibility as users can store arbitrary data, because this is arbitrary text, there is no validation of any format. For example, it is not uncommon for a JSON document to be encoded as a string and stored in an annotation.

Annotations are defined in the common metadata section in every Kubernetes object

```yaml
metadata:
    annotations:
        example.com/icon-url: "http://example.com/icon.png"
```
