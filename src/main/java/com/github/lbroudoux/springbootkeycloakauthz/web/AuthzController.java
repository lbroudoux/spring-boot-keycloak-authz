package com.github.lbroudoux.springbootkeycloakauthz.web;

import java.security.Principal;
import java.util.Arrays;
import java.util.HashSet;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;

import org.keycloak.KeycloakSecurityContext;
import org.keycloak.authorization.client.AuthzClient;
import org.keycloak.authorization.client.ClientAuthorizationContext;
import org.keycloak.authorization.client.resource.ProtectedResource;
import org.keycloak.authorization.client.resource.ProtectionResource;
import org.keycloak.representations.idm.authorization.ResourceRepresentation;
import org.keycloak.representations.idm.authorization.ScopeRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

/**
 * @author laurent
 */
@org.springframework.web.bind.annotation.RestController
@RequestMapping("/api/authz")
public class AuthzController {

   /** A simple logger for diagnostic messages. */
   private static Logger log = LoggerFactory.getLogger(AuthzController.class);

   @RequestMapping(value = "/createResource", method = RequestMethod.GET)
   public ResponseEntity<String> createResoure() {
      log.info("Executing createResource method");
      try {
         HashSet<ScopeRepresentation> scopes = new HashSet<>();
         scopes.add(new ScopeRepresentation("myscope"));

         ResourceRepresentation resource = new ResourceRepresentation("service-5a62055df9935e351cd655c6", scopes, "/api/services/5a62055df9935e351cd655c6",
               "urn:sbauthz-app:resources:service");

         AuthzClient authzClient = AuthzClient.create();
         ProtectionResource protectionResource = authzClient.protection();
         ProtectedResource resourceClient = protectionResource.resource();
         resourceClient.create(resource);
      } catch (Throwable t) {
         log.error("Caught Throwable when creating resource", t);
         t.printStackTrace();
      }
      return new ResponseEntity<>(HttpStatus.OK);
   }

   @RequestMapping(value = "/attachResource/{ownerId}", method = RequestMethod.GET)
   public ResponseEntity<String> attachResource(
         @PathVariable("ownerId") String ownerId,
         HttpServletRequest request) {
      log.info("Executing attachResource method");

      Principal user = request.getUserPrincipal();
      if (user != null) {
         log.info("Current user is " + user.getName());
      } else {
         log.info("No current user...");
      }

      try {
         AuthzClient authzClient = AuthzClient.create();
         ProtectedResource pResource = authzClient.protection().resource();

         ResourceRepresentation resource = pResource.findByName("service-5a62055df9935e351cd655c6");
         if (resource == null) {
            throw new RuntimeException("Could not find protected resource with name [service-5a62055df9935e351cd655c6]");
         }

         // First remove resource because owner cannot be changed...
         authzClient.protection().resource().delete(resource.getId());

         // Recreate resource with owner this time.
         HashSet<ScopeRepresentation> scopes = new HashSet<>();
         scopes.add(new ScopeRepresentation("myscope"));

         ResourceRepresentation newResource = new ResourceRepresentation("service-5a62055df9935e351cd655c6", scopes, "/api/services/5a62055df9935e351cd655c6",
               "urn:sbauthz-app:resources:service");
         newResource.setOwner(ownerId);

         authzClient.protection().resource().create(newResource);
      } catch (Throwable t) {
         log.error("Caught Throwable when attaching resource", t);
         t.printStackTrace();
      }
      return new ResponseEntity<>(HttpStatus.OK);
   }

   @RequestMapping(value = "/cleanResource", method = RequestMethod.GET)
   public ResponseEntity<String> cleanResource() {
      log.info("Executing cleanResource method");

      try {
         AuthzClient authzClient = AuthzClient.create();
         ProtectedResource pResource = authzClient.protection().resource();

         // pResource.findByName() does not seem to work in Keycloak 4.0.0.Final
         // when resource is attached to an owner that is not the realm client identifier.
         String[] resources = pResource.find(null, "service-5a62055df9935e351cd655c6", null, null, null, null, false, null, null);
         if (resources == null || resources.length != 1) {
            throw new RuntimeException("Could not find protected resource with name [service-5a62055df9935e351cd655c6]");
         }

         authzClient.protection().resource().delete(resources[0]);
      } catch (Throwable t) {
         log.error("Caught Throwable when creating resource", t);
         t.printStackTrace();
      }
      return new ResponseEntity<>(HttpStatus.OK);
   }

   @RequestMapping(value = "/checkIdentity", method = RequestMethod.GET)
   public ResponseEntity<String> checkIdentity(HttpServletRequest request) {
      log.info("Executing checkIdentity method");

      Object ksc = request.getAttribute(KeycloakSecurityContext.class.getName());
      if (ksc != null) {
         log.info("Got a KeycloakSecurityContext");
         KeycloakSecurityContext context = KeycloakSecurityContext.class.cast(ksc);
         log.info("User name: " + context.getToken().getName());
         log.info("Preferred name: " + context.getToken().getPreferredUsername());
         log.info("Given name: " + context.getToken().getGivenName());
         log.info("User id: " + context.getToken().getSubject());
         log.info("User roles: " + context.getToken().getRealmAccess().getRoles());

         Object authorizationContext = context.getAuthorizationContext();
         log.info("AuthorizationContext: " + authorizationContext);
         AuthzClient authzClient = ClientAuthorizationContext.class.cast(authorizationContext).getClient();
         log.info("Got an authzClient from context: " + authzClient.toString());
      }

      Principal user = request.getUserPrincipal();
      if (user != null) {
         log.info("Current user is " + user.getName());
      } else {
         log.info("No current user...");
      }

      return new ResponseEntity<>(HttpStatus.OK);
   }


   @RequestMapping(value = "/ownedResources/{ownerId}", method = RequestMethod.GET)
   public ResponseEntity<?> ownedResources(@PathVariable("ownerId") String ownerId) {
      log.info("Executing ownedResources method");

      try {
         AuthzClient authzClient = AuthzClient.create();
         ProtectedResource pResource = authzClient.protection().resource();

         String[] resources = pResource.find(null, null, null, ownerId, null, null, false, null, null);
         if (resources.length == 0) {
            throw new RuntimeException("Could not find protected resource with owner [" + ownerId + "]");
         }

         return new ResponseEntity<>(Arrays.asList(resources).stream().map(pResource::findById).collect(Collectors.toList()), HttpStatus.OK);
      } catch (Throwable t) {
         log.error("Caught Throwable when creating resource", t);
         t.printStackTrace();
      }
      return new ResponseEntity<>(HttpStatus.NOT_FOUND);
   }
}
