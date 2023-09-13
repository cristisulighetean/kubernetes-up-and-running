# Chapter 13: ConfigMaps (not yet tested)

`ConfigMaps` are used to provide configuration information for workloads. This can either be fine-grained information (a short string) or a composite value in the form of a file.

`Secrets` are similar to `ConfigMaps` but focused on making sensitive information available to the workload. They can be used for things like credentials or TLS certificates.

## ConfigMaps

One way to think of a ConfigMap is as a Kubernetes object that defines a small filesystem. Another way is as a set of variables that can be used when defining the environment or command line for your containers.

The key thing is that the ConfigMap is combined with the Pod right before it is run.

Example of creating a ConfigMap

```yaml
apiVersion: v1 
kind: Pod 
metadata:
  name: kuard-config 
spec:
  containers:
    - name: test-container
      image: gcr.io/kuar-demo/kuard-amd64:blue
      imagePullPolicy: Always
      command:
      - "/kuard"
      - "$(EXTRA_PARAM)" 
      env:
        - name: ANOTHER_PARAM 
          valueFrom:
            configMapKeyRef: 
              name: my-config
              key: another-param
        - name: EXTRA_PARAM 
          valueFrom:
            configMapKeyRef: 
            name: my-config
            key: extra-param
      volumeMounts:
        - name: config-volume
          mountPath: /config 
  volumes:
    - name: config-volume
      configMap:
        name: my-config
  restartPolicy: Never
```

For the `filesystem` method, we create a new volume inside the Pod and give it the name `config-volume`. We then define this volume to be a `ConfigMap` volume and point at the `ConfigMap` to mount. We have to specify where this gets mounted into the kuard container with a volumeMount. In this case we are mounting it at `/config`.