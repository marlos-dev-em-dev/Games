### USAR SOMENTE SE JA FEZ PELA PRIMEIRA VEZ

# Buildando

- abra o terminal na pasta do projeto

- execute

```bash
npm run build
```

- vá pegar um café (pode demorar um pouco)

- na pasta `dist` estarão os arquivos gerados


- caso tenha configurado os dois alvos (`portable` e `nsis`) serão gerados
(*portable* Usado somente para teste não instala o aplicativo e não contem desinstaladores)
(*nsis* Usado para aplicatovo comercial/distribuição tem istalador,atalho, criar um espaço proprio, e tem desistaladores)

saida:
Meu App.exe
Meu App Setup.exe


# Testando

- execute o `.exe`

- caso tenha gerado o instalador (`Setup.exe`) instale normalmente.
