
## Somente na primeira Vez:

# instalando Ubuntu

- terminal:
    wsl --install

* vá pegar um café (pode demorar bastante na primeira vez)

- quando ele responder algo do tipo: 
`Create a default Unix user account: 1952` apague o numero e escolha seu nome de usuario pos isso escolha a senha


# Abrindo o Ubuntu

- abra o Ubuntu pelo WSL `wsl -d Ubuntu`

- entre na pasta do projeto

# Instalando dependências

- atualize os pacotes

- terminal:
sudo apt update && sudo apt upgrade -y


* instale as dependências

- terminal:
sudo apt install -y \
python3 \
python3-pip \
python3-venv \
git \
zip \
unzip \
openjdk-17-jdk \
build-essential \
autoconf \
libtool \
pkg-config


# Criando ambiente

* crie o ambiente virtual

- terminal:
python3 -m venv .venv


* ative

- terminal:
source .venv/bin/activate


# Instalando Buildozer

- terminal:
pip install buildozer cython


# Criando configuração Android

* execute

- terminal:
buildozer init


* altere o arquivo `buildozer.spec`

Exemplo:

ini
title = Ola Mundo

package.name = olamundo

package.domain = com.exemplo

requirements = python3,pygame-ce

orientation = landscape

## Sempre:

# Buildando APK

* execute

- terminal:
buildozer -v android debug


* vá pegar outro café (pode demorar bastante na primeira vez)

* na pasta `bin` estará o seu `.apk`


bin/
└── olamundo-debug.apk


# Buildando AAB

* execute

- terminal:
buildozer android release


* na pasta `bin` estará o seu `.aab`


bin/
└── olamundo-release.aab


# Testando

* envie o `.apk` para o dispositivo e instale normalmente

ou

* conecte o dispositivo via USB com depuração ativada e use:

- terminal:
adb install bin/olamundo-debug.apk


(tem que dar permissão de depuração para o dispositivo pelo modo desenvolvedor)

# Atualizando

* sempre que alterar o código rode novamente:

- terminal:
buildozer -v android debug


# - Pós teste envie.



