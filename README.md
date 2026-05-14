<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/6ca0c3ad-e5dd-43df-8f09-447671005990

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

# Como transformar o projeto em um Aplicativo Android (APK)

Para transformar este sistema web em um aplicativo nativo para Android, usaremos o **[Capacitor](https://capacitorjs.com/)**, uma ferramenta oficial da equipe do Ionic que pega sua aplicação web (feita em React) e a empacota como um app móvel.

## Pré-requisitos na sua máquina local
1. **Node.js** instalado na sua máquina.
2. **Android Studio** instalado (necessário para compilar as ferramentas e gerar o `.apk`).

## Passo a Passo

### 1. Faça o download do seu projeto e instale as dependências
Exporte seu código aqui do AI Studio (Settings > Export to ZIP ou GitHub) e abra o terminal na pasta do projeto.
```bash
npm install
npm run build
```
*(O comando `build` irá gerar uma pasta chamada `dist` contendo a versão otimizada do seu app).*

### 2. Instalar o Capacitor
No mesmo terminal, instale o núcleo do Capacitor e sua interface de linha de comando:
```bash
npm install @capacitor/core
npm install -D @capacitor/cli
```

### 3. Inicializar o Capacitor
Agora crie o arquivo de configuração do Capacitor:
```bash
npx cap init
```
Ele fará algumas perguntas durante a inicialização:
- **App name**: Digite o nome do seu app (ex: `Meu App Financeiro`).
- **App Package ID**: Escolha um nome de pacote único (ex: `com.suaempresa.financeiro`).
- **Web asset directory**: Informe a aba de pasta dist, ou seja, digite `dist`.

### 4. Adicionar a funcionalidade para Android
Instale o módulo do Android e adicione a plataforma ao projeto:
```bash
npm install @capacitor/android
npx cap add android
```
*(Isso criará uma pasta chamada `android` no seu projeto contendo a estrutura de um app Android nativo).*

### 5. Sincronizar o seu código Web para o Android
Execute o comando a seguir para copiar seus arquivos da pasta `dist` (gerados no build) para dentro do pacote do app Android:
```bash
npx cap sync android
```

### 6. Abrir e Gerar o APK pelo Android Studio
Por último, abra o projeto no Android Studio rodando:
```bash
npx cap open android
```
Dentro do Android Studio (espere ele carregar e indexar os arquivos, mostrado na barra de carregamento inferior):
1. No menu superior da janela, vá em **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
2. O Android Studio começará a construir seu APK. Se tudo ocorrer bem, aparecerá um pop-up de sucesso no canto inferior direito.
3. Clique me **locate** nessa janelinha (ou navegue até `android/app/build/outputs/apk/debug/`) para encontrar o seu arquivo `app-debug.apk`.

Agora basta transferir este arquivo `.apk` para o seu aparelho Android e realizar a instalação!

---
> **Aviso Importante sobre Atualizações:** Sempre que você editar seu código web (React, Tailwind, Express), você precisa rodar os processos visuais para Android novamente para que as alterações surtam efeito no celular:
> ```bash
> npm run build
> npx cap sync android
> ```
> Depois, proceda em **Build APK(s)** no Android Studio.
