# spring-boot-keycloak-authz

Sample AngularJS / Spring Boot app using Keycloak Authorization services.


Fex months ago, I've played with [Authorization services in Keycloak](https://www.keycloak.org/docs/3.4/authorization_services/index.html)
(was using the 3.4.0.Final) and I’d like to share  some feedbacks and thoughts about using it on my Spring Boot application.
Disclaimer: I’m not a security guru and may have misunderstood some concepts.

The goal of this repository is to light up some parts that seems a little weird to me. And eventually work onto a better
approach.

Basically, my need was the following : to associate a role to particular resource instances (and not resource types).
For example, in my app I wanted to declare a user has being able to manage the services « ABC » and « DEF » but not the « XYZ ».
Some actions on this resource instances (update / delete) are denied to other users and roles.

In practical, this implies to :
 - Being able to have the information (resource instances manageable by user) on the client side in order to adapt the GUI 
    (adding some buttons, displaying some admin infos, …)
 - Being able to get this information on server side to filter out REST APIs
 - Having some complete APIs allowing :
	- To get list of candidate users,
	- To associate resource instances to users,
        - To get resource instances manageable by any user (when being a super-admin)

At first, I thought it was a good pick for [Keycloak Authorization services](https://www.keycloak.org/docs/3.4/authorization_services/index.html)
and that it will solve all my problems. The application within its repository highlights that:
 - All issues/requirements are not solved by AuthZ services only but with a mix of different Keycloak APIs,
 - UMA and AuthZ Services may not be the best fit as the problem they solved is much more related to protect private 
    resources and not easily allow management of shared ones.

## Setup

### Clone repository

So start by cloning this repository to get a fresh local copy:

```
$ git clone https://github.com/lbroudoux/spring-boot-keycloak-authz.git
```

### Keycloak

Download a Keycloak distribution (I have used `3.4.0-Final` release) and start the server locally.
You'll just have to go to `${KEYCLOAK_HOME}/bin` directory and execute the following command. 

```
$ ./standalone.sh -Djboss.socket.binding.port-offset=100
```

That way, you should have a running instance at `http://localhost:8180`. This is the default URL 
used by application and cannot be changed easily yet.

Use that URL in your browser to access the administration console of Keycloak.
It is located at `http://localhost:8180/auth`. Connect using the Keycloak default administration user
`admin/123` if it's the first time you login. Keycloak requires changing this passwork at first login.

#### Configure application realms and authorizations

Create a new Keycloak realm by importing the `/src/main/resources/sbauthz-realm-config.json` file.
This should a realm called simply `sbauthz`.

Within this realm configuration, go to **Clients** > **sbauthz-app**. Pick the **Authorization** thumbnail
and within the **Settings**, import the `/src/main/resources/sbauthz-authorization-config.json` file.
  
All your default resources, policies and permissions should have been set now!


### Spring Boot application

Before lauching everything, you need to retrieve some frontend compoents. For that, we'll use `bower`.
So just execute `bower install` within your clone directory.

Now just launch the `mvn spring-boot:run` command:

```
 .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::       (v1.5.10.RELEASE)

[INFO] com.github.lbroudoux.springbootkeycloakauthz.SpringBootKeycloakAuthzApplication - Starting SpringBootKeycloakAuthzApplication on lbroudoux-OSX with PID 5607 (/Users/lbroudou/Development/github/spring-boot-keycloak-authz/target/classes started by lbroudou in /Users/lbroudou/Development/github/spring-boot-keycloak-authz)
[DEBUG] com.github.lbroudoux.springbootkeycloakauthz.SpringBootKeycloakAuthzApplication - Running with Spring Boot v1.5.10.RELEASE, Spring v4.3.14.RELEASE
[INFO] com.github.lbroudoux.springbootkeycloakauthz.SpringBootKeycloakAuthzApplication - No active profile set, falling back to default profiles: default
[DEBUG] org.jboss.logging - Logging Provider: org.jboss.logging.Slf4jLoggerProvider found via system property
[DEBUG] org.keycloak.adapters.tomcat.AbstractKeycloakAuthenticatorValve - Using org.keycloak.adapters.springboot.KeycloakSpringBootConfigResolver to resolve Keycloak configuration on a per-request basis.
[INFO] com.github.lbroudoux.springbootkeycloakauthz.SpringBootKeycloakAuthzApplication - Started SpringBootKeycloakAuthzApplication in 1.783 seconds (JVM running for 4.451)

```

The application has started after you just see those lines. The application is deployed on `http://localhost:8080`.


## Playing around

Default configuration comes with 3 users:
* admin (`admin/123`) is administrator and is able to administrate realm
* jdoe (`jdoe/jdoe`) is simple user
* alice (`alice/alice`) is user and manager of resources
   
All users have extra role `uma_authorization` so that they can respond to UMA Challenge.

### Endpoints

The main page for tests is `http://localhost:8080/#/authz`. It is reachable via the `User Mgt` entry menu that
is only visible for the `admin` role.

* `Get Users` allows to retrieve all users from realm,

> Once users have been loaded, you should have access to extra links in order to get user roles, attach resource to 
users or get resources managed/owned by user. See below for more on resources,  

* `Create Resource` illustrates the declaration of a Resource on Keycloak side,
* `Clean Resource` illustrates how to destroy a Resource on Keycloak side,
* `Check Identity` illustrates the invocation of a protected Resource with resolution of the UMA challenge on the client side.