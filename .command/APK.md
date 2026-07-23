### USAR SOMENTE SE JA FEZ PELA PRIMEIRA VEZ

# Atualizando os arquivos Android

- sempre que alterar qualquer arquivo dentro da pasta `www` execute
  - terminal (não presisa de admin):
      npx cap sync


ou
  - terminal (não presisa de admin):
      npx cap copy


# Abrindo o terminal

- entre na pasta android
  - terminal (não presisa de admin):
      cd android


# Buildando APK

- execute
  - terminal (não presisa de admin):
      .\gradlew assembleRelease


- vá pegar um café (pode demorar um pouco)

- na pasta `android\app\build\outputs\apk\release` estará o seu `.apk`

# Buildando AAB

- execute
  - terminal (não presisa de admin):
      .\gradlew bundleRelease


- vá pegar um café (pode demorar um pouco)

- na pasta `android\app\build\outputs\bundle\release` estará o seu `.aab`
(*ABB* é obrigatorio caso a intenção seja play store)

# Testando

- para instalar via adb conecte o dispositivo por USB e execute
  - terminal (não presisa de admin):
      adb install app\build\outputs\apk\release\app-release.apk


(é necessário permitir a depuração USB no dispositivo)

- outra opção é copiar o `.apk` para o celular e instalar normalmente clicando sobre ele.
