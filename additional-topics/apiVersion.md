# Choosing the appropriate apiVersion

Choosing the appropriate `apiVersion` for a Kubernetes resource is crucial when defining your Kubernetes manifests. Here's how you can decide on the correct apiVersion:

1. Understand Your Kubernetes Cluster Version:

   - Use kubectl version to know your cluster's version. Depending on your cluster's version, some apiVersions might be available, and some might not.

2. Consult the Kubernetes Documentation:
   - For each release of Kubernetes, the official documentation lists all the API resources available and their corresponding apiVersion.
   - The Kubernetes API reference is especially helpful. It's versioned, so ensure you're looking at the documentation for your cluster's version.
3. Understand the API Version Categories:
   - `alpha`: This is an experimental version that might have breaking changes in the future and might not be available by default in all clusters. Features might be incomplete.
   - `beta`: This is a more stable version than alpha, with features that are expected to be a stable part of the API but are still being tested out. They might undergo minor changes, but the way they work shouldn't fundamentally change.
   - `stable`: These versions are safe for production.
4. Use `kubectl` for Discovery:
   - You can use `kubectl api-versions` to see all API versions currently supported by your cluster.
   - Additionally, kubectl explain `<resource>.<version>` can help you understand the structure and fields of a particular resource. For example: kubectl explain pods.v1.
5. Look for Deprecations:
   - As Kubernetes evolves, certain API versions are deprecated. When you upgrade your cluster, ensure that you're aware of any deprecations in the new version, and update your manifests accordingly.
6. Default to `Stable`:
   - If a resource is available in a stable API version (i.e., v1), it's generally best to use that unless you have a specific need for a feature only available in an alpha or beta version.
7. Stay Updated:
   - Kubernetes is an actively developed project. Stay updated with its releases, especially the minor ones, as they can introduce new stable versions of the APIs or deprecate the older versions.
8. Consider Tooling:
   - There are tools and plugins, such as [kubeval](https://kubeval.instrumenta.dev), that can validate your Kubernetes manifests against a specific version of the Kubernetes schema. These can help catch issues with using outdated or incorrect apiVersions.

In general, always strive to use the most stable version available to you that meets your feature needs, and keep your manifests updated as Kubernetes evolves.
