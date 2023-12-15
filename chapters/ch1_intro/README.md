# Chapter 1: Introduction

Main benefits of Kubernetes and container APIs:
- `Immutability`
- `Declarative configuration`
  - It is the job of Kubernetes to ensure that the actual state of the world matches this desired state.
- `Online self-healing systems`
  - It continuously takes actions to ensure that the current state matches the desired state

`Imperative configuration` - the state of the world is defined by the execution of a series of instructions rather than a declaration of the desired state of the world

The idea of storing declarative configuration in source control is often referred to as “infrastructure as code.”

## Main bits of Kubernetes

- `Pods`, or groups of containers, can group together container images developed by different teams into a single deployable unit.
- `Kubernetes services` provide load balancing, naming, and discovery to isolate one microservice from another.
- `Namespaces` provide isolation and access control, so that each microservice can control the degree to which other services interact with it.
- `Ingress objects` provide an easy-to-use frontend that can combine multiple micro‐ services into a single externalized API surface area.
