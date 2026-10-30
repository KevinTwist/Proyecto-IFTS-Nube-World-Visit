import { Amplify } from 'aws-amplify';
import { environment } from '../../environments/environment';

export function configureAmplify(): void {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: environment.cognito.userPoolId,
        userPoolClientId: environment.cognito.userPoolClientId,
        // Aquí es donde vinculamos el Identity Pool junto al User Pool en la v6 de Amplify:
        // identityPoolId: environment.cognito.identityPoolId, 
        loginWith: {
          email: true,
        },
        signUpVerificationMethod: 'code',
        userAttributes: {
          email: {
            required: true,
          },
        },
      },
    },
    Storage: {
      S3: {
        bucket: 'word-visit-perfil',
        region: 'us-east-1'
      }
    }
  });
}
