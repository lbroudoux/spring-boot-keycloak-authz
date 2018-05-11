package com.github.lbroudoux.springbootkeycloakauthz;

import org.keycloak.representations.adapters.config.PolicyEnforcerConfig.UserManagedAccessConfig;
import org.springframework.boot.context.properties.ConfigurationPropertiesBinding;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * @author laurent
 */
@Component
@ConfigurationPropertiesBinding
public class KeycloakUmaProtocolConfigConverter implements Converter<String, UserManagedAccessConfig> {

   @Override
   public UserManagedAccessConfig convert(String source) {
      if (source == null){
         return null;
      }
      return new UserManagedAccessConfig();
   }
}
