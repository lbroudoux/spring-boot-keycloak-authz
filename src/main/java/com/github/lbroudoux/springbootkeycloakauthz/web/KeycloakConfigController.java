package com.github.lbroudoux.springbootkeycloakauthz.web;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

/**
 * A Rest controller for dispatching Keycloak configuration to frontend.
 * @author laurent
 */
@RestController
@RequestMapping("/api/keycloak")
public class KeycloakConfigController {

   /** A simple logger for diagnostic messages. */
   private static Logger log = LoggerFactory.getLogger(KeycloakConfigController.class);


   @Value("${keycloak.auth-server-url}")
   private final String keycloakServerUrl = null;

   @Value("${keycloak.realm}")
   private final String keycloakRealmName = null;

   @RequestMapping(value = "/config", method = RequestMethod.GET)
   public ResponseEntity<?> getConfig() {
      final Config config = new Config(keycloakRealmName, keycloakServerUrl);

      log.debug("Returning '{}' realm config, for {}", keycloakRealmName, keycloakServerUrl);

      return new ResponseEntity<>(config, HttpStatus.OK);
   }


   private class Config{

      private String realm = "sbauthz";

      @JsonProperty("auth-server-url")
      private String authServerUrl = "http://localhost:8180/auth";

      @JsonProperty("ssl-required")
      private final String sslRequired = "external";

      @JsonProperty("public-client")
      private final boolean publicClient = true;

      private final String resource = "sbauthz-app-js";


      public Config(String realmName, String authServerUrl) {
         if (realmName != null && !realm.isEmpty()) {
            this.realm = realmName;
         }
         if (authServerUrl != null && !authServerUrl.isEmpty()) {
            this.authServerUrl = authServerUrl;
         }
      }

      public String getRealm() {
         return realm;
      }

      public String getAuthServerUrl() {
         return authServerUrl;
      }

      public String getSslRequired() {
         return sslRequired;
      }

      public boolean isPublicClient() {
         return publicClient;
      }

      public String getResource() {
         return resource;
      }
   }
}
