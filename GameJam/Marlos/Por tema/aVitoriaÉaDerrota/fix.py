"""
fix.py — Corrige OY -> 0 no main.py
Execute: python fix.py
"""
import os

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "main.py")

with open(path, "r", encoding="utf-8") as f:
    code = f.read()

count = code.count("(OX, OY)")

if count == 0:
    print("Nenhuma ocorrencia de '(OX, OY)' encontrada. Ja foi corrigido?")
else:
    code = code.replace("(OX, OY)", "(OX, 0)")
    with open(path, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Corrigido: {count} ocorrencias de (OX, OY) -> (OX, 0)")
    print("Rode: python main.py")