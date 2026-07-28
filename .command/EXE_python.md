# Instalando dependências

- crie o ambiente virtual

- terminal:
    python -m venv .venv
`

* ative o ambiente virtual

- terminal:
    .venv\Scripts\activate


* instale o PyInstaller

- terminal:
    python -m pip install pyinstaller


* caso seja um projeto pygame instale

- terminal:
    python -m pip install pygame-ce


# Buildando

* execute o comando

- terminal:
    python -m PyInstaller --onefile --windowed main.py


* vá pegar um café (pode demorar um pouco)

* na pasta `dist` estará o seu `.exe`


dist/
└── main.exe


# Testando

* execute o arquivo

- terminal:
    dist\main.exe


* caso seja um jogo ou aplicação gráfica a janela abrirá normalmente.

# Atualizando

* sempre que alterar o código rode novamente

- terminal:
    python -m PyInstaller --onefile --windowed main.py


# - Pós teste envie.



