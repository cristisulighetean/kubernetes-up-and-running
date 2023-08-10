# Chapter 2: Creating & running containers

## Simple node application

Build the simple-node Docker image:

```sh
$ docker build -t simple-node .
```

Start the container:

```sh
$ docker run --rm -p 3000:3000 simple-node
```

Navigate to http://localhost:3000 to access the program running in the container.

## Multistage image builds

You can build and run this image with the following commands:

```sh
$ docker build -t kuard .
$ docker run --rm -p 8080:8080 kuard
```

## Storing images in a remote registry

