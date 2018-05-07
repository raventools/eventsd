# EventsD Dashboard

EventsD is used by the Raven platform for logging structured application
events. These events may include debugging messages, exceptions, etc.  This
dashboard allows you to search and view event data.

## `application`

Contains a nodejs express app that powers the dashboard.

## `eventsd`

The EventsD daemon.  Listens for UDP messages from the app and stores them in
redis.

## `lib`

Client library for use in nodejs applications.

## `library`

Example PHP Client library.  Not used directly.

## `vagrant`

Vagrant box for dev/testing the dashboard and daemon.
