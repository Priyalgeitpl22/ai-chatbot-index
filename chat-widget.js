(function (global) {
  const ChatWidget = {
    globalStylesInjected: false,
    userName: '',
    userEmail: '',
    // State for user info collection: "none", "waitingForName", "waitingForEmail", "done"
    collectUserInfoState: "none",
    // Property to temporarily store the first user message during identification
    pendingUserMessage: null,
    threadId: null,
    chatHistory: [],

    async init(options) {
      const response = await fetch(`http://localhost:5003/api/chat/config?orgId=${options.orgId}`);
      const data = await response.json();

      const defaultOptions = {
        elementId: "chat-widget",
        apiEndpoint: data.data?.socketServer,
        addChatBotName: data.data?.addChatBotName,
        ChatBotLogoImage: data.data?.ChatBotLogoImage,
        allowFileUpload: data.data?.allowFileUpload,
        allowNameEmail: data.data?.allowNameEmail,
        allowCustomGreeting: data.data?.allowCustomGreeting,
        customGreetingMessage: data.data?.customGreetingMessage,
        allowFontFamily:data.data?.allowFontFamily, 
        customFontFamily:data.data?.customFontFamily,
        allowEmojis: data.data?.allowEmojis,
        position: data.data?.position,
        orgId: data.data?.aiOrgId,
        iconColor: data.data?.iconColor,
        chatWindowColor: data.data?.chatWindowColor,
        fontColor: data.data?.fontColor,
        availability: data.data?.availability,
        socketServer: data.data?.socketServer,
      };
      this.options = { ...defaultOptions };
      this.container = document.getElementById(this.options.elementId);
      if (!this.container) {
        console.error("Chat widget container not found!");
        return;
      }
      this.socket = io(this.options.socketServer);
      this.onlinAgents = [];
      this.injectGlobalStyles();
      this.renderIcon();
    },

    getPositionStyles() {
      return this.options.position === "bottom-left"
        ? "left: 10px; bottom: 10px;"
        : "right: 10px; bottom: 10px;";
    },

    injectStyle(cssText) {
      const style = document.createElement("style");
      style.innerHTML = cssText;
      document.head.appendChild(style);
    },

    injectGlobalStyles() {
      if (this.globalStylesInjected) return;
      const fontFamily = this.options.allowFontFamily 
      ? `${this.options.customFontFamily}, sans-serif` 
      : `Arial, sans-serif`;
      const css = `
        /* Global Styles */
        .chat-icon:hover { opacity: 0.8; }
        .chat-widget { font-family: ${fontFamily} !important; position: fixed; border: 1px solid #ddd; border-radius: 5px; width: 380px; height: 550px; display: flex; flex-direction: column; }
        .chat-header { color: white; border-radius: 5px 5px 0 0; }
        .chat-messages { flex: 1; overflow-y: scroll; scrollbar-width: none; -ms-overflow-style: none; padding: 10px; border-top: 1px solid #ddd; display: flex; flex-direction: column; }
        .chat-messages::-webkit-scrollbar { display: none; }
        .message { padding: 8px 10px; border-radius: 10px; max-width: 80%; margin-top: 5px; display: inline-block; }
        .message.agent { background-color: #f1f1f1; color: #000; align-self: flex-start; }
        .message.user { background-color: ${this.options.iconColor}; color: white; align-self: flex-end; word-break: break-all; }
        .chat-input-container { display: flex; padding: 10px; gap: 5px; position: relative; }
        #chat-input { flex: 1; resize: none; border-radius: 5px; padding: 5px; overflow: auto; }
        #chat-input::-webkit-scrollbar { display: none; }
        .chat-actions { display: flex; }
        .chat-actions button { cursor: pointer; color: white; border: none; border-radius: 5px; padding: 5px; background: none; opacity: 0.7; }
        .chat-actions button:hover { opacity: 0.8; }
        .contact-form { padding: 10px; display: flex; flex-direction: column; align-items: center; }
        .contact-form input, .contact-form textarea { width: 100%; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; background-color: #fafafa; font-size: 14px; transition: border-color 0.3s, box-shadow 0.3s; }
        .contact-form input:focus, .contact-form textarea:focus { border-color: #667eea; box-shadow: 0 0 5px rgba(102,126,234,0.5); outline: none; }
        .contact-form button { width: 100%; color: #fff; background: ${this.options.iconColor}; border: none; border-radius: 5px; padding: 10px; font-size: 16px; cursor: pointer; opacity: 0.8; transition: background 0.3s; }
        .contact-form button:hover { opacity: 1; background: ${this.options.iconColor}; }
        .emoji-picker { cursor: pointer; }
        .emoji-picker-container { position: absolute; bottom: 70px; left: 20px; z-index: 9999; display: none; border: 1px solid #ccc; border-radius: 5px; width: 340px; height: 200px; overflow: auto; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .emoji-picker-container #shadow-root .picker .favorites { display: none; }
        textarea { border: none; }
        textarea:focus { outline: none; border: none; }
        .chat-input-wrapper { display: flex; width: 100%; padding: 3px 5px; border: 1px solid #ddd; border-radius: 5px; }
        .message.agent.loading .typing-indicator { display: flex; align-items: center; }
        .message.agent.loading .typing-indicator span { background-color: #ccc; border-radius: 50%; width: 8px; height: 8px; margin: 0 2px; animation: typing 1s infinite; }
        .message.agent.loading .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .message.agent.loading .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing { 0% { opacity: 0.2; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-3px); } 100% { opacity: 0.2; transform: translateY(0); } }
      `;
      this.injectStyle(css);
      this.globalStylesInjected = true;
    },

    // Helper function to store the user message in UI and send it to backend.
    storeUserMessage(content) {
      this.appendMessage("User", content);
      if (this.threadId) {
        this.socket.emit("sendMessage", {
          sender: "User",
          content,
          threadId: this.threadId,
          aiOrgId: this.options.orgId,
          allowNameEmail: this.options.allowNameEmail,
          createdAt: Date.now()
        });
      }
    },

    // Helper function to store a bot message.
    storeBotMessage(content) {
      this.appendMessage("ChatBot", content);
      if (this.threadId) {
        this.socket.emit("sendMessage", {
          sender: "Bot",
          content,
          threadId: this.threadId,
          aiOrgId: this.options.orgId,
          allowNameEmail: this.options.allowNameEmail,
          createdAt: Date.now()
        });
      }
    },

    renderIcon() {
      const positionStyles = this.getPositionStyles();
      const isBottomRight = this.options.position === "bottom-right";
      this.container.innerHTML = `
        <div class="chat-container ${isBottomRight ? "bottom-right" : "bottom-left"}" style="position: fixed; ${positionStyles}; display: flex; align-items: center;">
          <div class="chat-icon" style="cursor: pointer; background-color: ${this.options.iconColor}; color: white; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">
            💬
          </div>
          <div class="chat-message" id="chat-message" style="background: white; color: black; padding: 8px 12px; border-radius: 15px; box-shadow: 0px 2px 5px rgba(0,0,0,0.2); ${isBottomRight ? "margin-left: 10px;" : "margin-right: 10px;"} font-size: 14px; display: none; align-items: center;">
            Hello and welcome to Chat360 👋
            <button id="close-message" style="background: none; border: none; font-size: 16px; ${isBottomRight ? "margin-right: 8px;" : "margin-left: 8px;"} cursor: pointer;">&times;</button>
          </div>
        </div>
      `;
      if (isBottomRight) {
        this.container.querySelector(".chat-container").style.flexDirection = "row-reverse";
      }
      this.container
        .querySelector(".chat-icon")
        .addEventListener("click", () => this.renderChatWindow());
      document
        .getElementById("close-message")
        .addEventListener("click", () => {
          document.getElementById("chat-message").style.display = "none";
        });
      setTimeout(() => {
        const chatMessage = document.getElementById("chat-message");
        if (chatMessage) chatMessage.style.display = "flex";
      }, 2000);
    },

    renderChatWindow() {
      const positionStyles = this.getPositionStyles();
      this.container.innerHTML = `
        <div class="chat-widget" style="${positionStyles} background-color: ${this.options.chatWindowColor}; color: ${this.options.fontColor};">
          <div class="chat-header" style="background-color: ${this.options.iconColor}; display: flex; justify-content: space-between; align-items: center; padding: 10px 20px;">
            <div style="display: flex; align-items: center;">
              <div id="avatar-container" style="margin-right: 10px;">
                <img id="avatar" src=${this.options.ChatBotLogoImage||"https://www.w3schools.com/w3images/avatar2.png"} alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
              </div>
              <div style="display: flex; flex-direction: column;">
                <span style="color: white; font-size: 18px; font-weight: bold;">${this.options.addChatBotName ||'ChatBot'}</span>
                <div style="display: flex; align-items: center; gap: 5px; font-size: 12px; color: #fff;">
                  <div style="width:8px; height:8px; border-radius:50%; background-color: rgb(16, 185, 129);"></div>
                  Online
                </div>
              </div>
            </div>
            <button id="close-chat" style="background: none; color: white; border: none; font-size: 14px; cursor: pointer;">
              <img src="https://cdn-icons-png.flaticon.com/128/8213/8213476.png" alt="Close" width="16px" />
            </button>
          </div>
          <div class="chat-messages" id="chat-messages" style="display: flex; flex-direction: column;"></div>
          ${this.options.availability ? this.chatInputTemplate() : this.contactFormTemplate()}
        </div>
      `;
      document.getElementById("close-chat").addEventListener("click", () => this.renderIcon());
      if (this.options.availability) {
        this.setupEventListeners();
      } else {
        this.setupContactFormListener();
      }
      this.startChatThread();
    },

    renderContactForm() {
      const chatWidget = document.querySelector(".chat-widget");
      if (!chatWidget) return;
      if (document.getElementById("contact-form-container")) return;
      const formContainer = document.createElement("div");
      formContainer.id = "contact-form-container";
      formContainer.innerHTML = this.contactFormTemplate();
      const chatInputContainer = document.querySelector(".chat-input-container");
      if (chatInputContainer) {
        chatWidget.insertBefore(formContainer, chatInputContainer);
      } else {
        chatWidget.appendChild(formContainer);
      }
      this.setupContactFormListener();
    },

    getMessageTime() {
      return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },

    fetchIp() {
      return fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => data.ip)
        .catch(() => "unknown");
    },

    startChatThread() {
      const currentUrl = window.location.href;
      this.fetchIp().then(ipAddress => {
        const payload = {
          sender: "User",
          aiOrgId: this.options.orgId,
          url: currentUrl,
          ip: ipAddress,
          name: this.userName || '',
          email: this.userEmail || ''
        };
        this.socket.emit("startChat", payload);
        this.socket.once("chatStarted", (data) => {
          this.threadId = data.threadId;
          const greetingMessage = this.options.allowCustomGreeting && this.options.customGreetingMessage
            ? this.options.customGreetingMessage
            : "Hello! How can I help you?";

          this.storeBotMessage(greetingMessage);
        });
      });
    },

    sendMessage() {
      const chatInput = document.getElementById("chat-input");
      const message = chatInput.value.trim();
      if (!message) return;
      // Append user's message to UI
      this.appendMessage("User", message);
      chatInput.value = "";

      // Identification flow when allowNameEmail is true
      if (this.options.allowNameEmail) {
        if (this.collectUserInfoState === "none") {
          // Save the first user message as pending (it has been stored via appendMessage and socket.emit)
          this.pendingUserMessage = message;
          this.socket.emit("sendMessage", {
            sender: "User",
            content: message,
            threadId: this.threadId,
            aiOrgId: this.options.orgId,
            allowNameEmail: this.options.allowNameEmail,
            createdAt: Date.now()
          });
          this.collectUserInfoState = "waitingForName";
          this.storeBotMessage("Please enter your name:");
          return;
        } else if (this.collectUserInfoState === "waitingForName") {
          // Treat this message as the user's name
          this.userName = message;
          this.socket.emit("sendMessage", {
            sender: "User",
            content: message,
            threadId: this.threadId,
            aiOrgId: this.options.orgId,
            allowNameEmail: this.options.allowNameEmail,
            createdAt: Date.now()
          });
          this.collectUserInfoState = "waitingForEmail";
          this.storeBotMessage(`Thank you, ${this.userName}. Please enter your email:`);
          return;
        } else if (this.collectUserInfoState === "waitingForEmail") {
          // Treat this message as the user's email
          this.userEmail = message;
          this.socket.emit("sendMessage", {
            sender: "User",
            content: message,
            threadId: this.threadId,
            aiOrgId: this.options.orgId,
            allowNameEmail: this.options.allowNameEmail,
            createdAt: Date.now()
          });
          this.collectUserInfoState = "done";
          // Update thread info on the server.
          this.socket.emit("updateThreadInfo", {
            threadId: this.threadId,
            name: this.userName,
            email: this.userEmail,
          });
          // Show the typing indicator before processing the pending message.
          this.appendTypingIndicator();
          // Now process the pending first message without re-displaying it.
          if (this.pendingUserMessage) {
            this.socket.emit("processPendingMessage", {
              sender: "User",
              content: this.pendingUserMessage,
              threadId: this.threadId,
              aiOrgId: this.options.orgId,
              createdAt: Date.now()
            });
            this.pendingUserMessage = null;
          }
          return;
        }
      }

      // Normal flow when allowNameEmail is false or identification is complete.
      this.socket.emit("sendMessage", {
        sender: "User",
        content: message,
        threadId: this.threadId,
        aiOrgId: this.options.orgId,
        allowNameEmail: this.options.allowNameEmail,
        createdAt: Date.now()
      });
      if (this.onlinAgents.length === 0) this.appendTypingIndicator();
      this.socket.emit("updateDashboard", {
        sender: "User",
        content: message,
        threadId: this.threadId,
        createdAt: Date.now()
      });
    },

    chatInputTemplate() {
      return `
        <div class="chat-input-container">
          <div class="chat-input-wrapper">
            <textarea id="chat-input" placeholder="Type a message..."></textarea>
            <div class="chat-actions">
              ${this.options.allowEmojis ? '<button id="emoji-picker"><img src="https://cdn-icons-png.flaticon.com/128/4989/4989500.png" alt="Emoji" width="20" height="20" /></button>' : ""}
              ${this.options.allowFileUpload ? '<input type="file" id="file-upload" style="display: none;" /><button id="upload-button"><img src="https://cdn-icons-png.flaticon.com/128/10847/10847957.png" alt="Upload" width="20" height="20"/></button>' : ""}
              <button id="send-message"><img src="https://cdn-icons-png.flaticon.com/128/9333/9333991.png" alt="Send" width="20" height="20"/></button>
            </div>
          </div>
        </div>
      `;
    },

    contactFormTemplate() {
      return `
        <div class="contact-form">
          <h3>Raise a ticket</h3>
          <input type="text" id="contact-name" placeholder="Your Name" required />
          <input type="email" id="contact-email" placeholder="Your Email" required />
          <textarea id="contact-message" placeholder="Your Message" rows="4" required></textarea>
          <button id="submit-contact">Submit</button>
        </div>
      `;
    },

    setupEventListeners() {
      const sendMessageButton = document.getElementById("send-message");
      const chatInput = document.getElementById("chat-input");
      const fileUploadInput = document.getElementById("file-upload");
      const uploadButton = document.getElementById("upload-button");
      const emojiPickerButton = document.getElementById("emoji-picker");

      sendMessageButton.addEventListener("click", () => this.sendMessage());
      chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendMessageButton.click();
        }
      });

      this.socket.on("receiveMessage", (data) => {
        if (document.getElementById("typing-indicator")) this.removeTypingIndicator();
        this.appendMessage("ChatBot", data.content);
        if (data.task_creation) this.renderContactForm();
      });

      this.socket.on("typing", () => this.appendTypingIndicator());
      this.socket.on("stopTyping", () => this.removeTypingIndicator());
      this.socket.on("agentStatusUpdate", (data) => { this.onlinAgents = data; });
      this.socket.on("updateDashboard", (data) => {
        if (data.sender === "Bot" && data.threadId === this.threadId) {
          if (document.getElementById("typing-indicator")) this.removeTypingIndicator();
          this.appendMessage("ChatBot", data.content);
        }
      });

      if (uploadButton && fileUploadInput) {
        uploadButton.addEventListener("click", () => fileUploadInput.click());
        fileUploadInput.addEventListener("change", (event) => {
          const file = event.target.files[0];
          if (file) this.storeUserMessage(`Uploaded: ${file.name}`);
        });
      }

      if (this.options.allowEmojis) this.setupEmojiPicker(chatInput, emojiPickerButton);
    },

    setupEmojiPicker(chatInput, emojiPickerButton) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "https://cdn.jsdelivr.net/npm/emoji-picker-element@1.26.1/picker.min.js";
      script.onload = () => {
        const picker = document.createElement("emoji-picker");
        picker.classList.add("emoji-picker-container");
        document.body.appendChild(picker);
        picker.style.setProperty("--emoji-size", "1.1rem");
        picker.style.setProperty("--num-columns", "9");
        picker.style.setProperty("--background", "#f5f5f5");
        picker.style.setProperty("--border-color", "none");
        picker.style.setProperty("--button-active-background", "#999");
        picker.style.setProperty("--button-hover-background", "#d9d9d9");

        const shadowRoot = picker.shadowRoot;
        if (shadowRoot) {
          const favoritesSection = shadowRoot.querySelector(".favorites");
          if (favoritesSection) favoritesSection.style.display = "none";
          const tabPanel = shadowRoot.querySelector(".tabpanel");
          if (tabPanel) {
            const style = document.createElement("style");
            style.innerHTML = `
              .tabpanel::-webkit-scrollbar { width: 5px; }
              .tabpanel::-webkit-scrollbar-track { background-color: #f1f1f1; }
              .tabpanel::-webkit-scrollbar-thumb { background-color: #888; border-radius: 10px; }
              .tabpanel::-webkit-scrollbar-thumb:hover { background-color: #555; }
            `;
            shadowRoot.appendChild(style);
          }
        }

        emojiPickerButton.addEventListener("click", (event) => {
          event.stopPropagation();
          picker.style.display = picker.style.display === "none" || picker.style.display === "" ? "block" : "none";
        });
        document.addEventListener("click", (event) => {
          if (picker.style.display === "block" && !picker.contains(event.target) && event.target !== emojiPickerButton) {
            picker.style.display = "none";
          }
        });
        picker.addEventListener("emoji-click", (event) => {
          chatInput.value += event.detail.unicode;
        });
      };
      document.body.appendChild(script);
    },

    setupContactFormListener() {
      const submitButton = document.getElementById("submit-contact");
      if (submitButton) {
        submitButton.addEventListener("click", () => {
          const name = document.getElementById("contact-name").value.trim();
          const email = document.getElementById("contact-email").value.trim();
          const message = document.getElementById("contact-message").value.trim();
          if (name && email && message) {
            this.socket.emit("createTask", {
              aiOrgId: this.options.orgId,
              threadId: this.threadId,
              name,
              email,
              query: message
            });
            const formContainer = document.getElementById("contact-form-container");
            if (formContainer) formContainer.remove();
            const chatInputContainer = document.querySelector(".chat-input-container");
            if (chatInputContainer) {
              const successMessage = document.createElement("div");
              successMessage.id = "task-success-message";
              successMessage.style.textAlign = "center";
              successMessage.style.padding = "5px";
              successMessage.style.backgroundColor = "#d4edda";
              successMessage.style.color = "#155724";
              successMessage.textContent = "Tickets raised successfully";
              chatInputContainer.parentNode.insertBefore(successMessage, chatInputContainer);
              setTimeout(() => { if (successMessage) successMessage.remove(); }, 3000);
            }
          } else {
            alert("Please fill in all fields.");
          }
        });
      }
    },

    appendMessage(sender, message) {
      const messagesContainer = document.getElementById("chat-messages");
      const timeStr = this.getMessageTime();
      const msgElem = document.createElement("div");
      const timeElem = document.createElement("div");
      msgElem.className = `message ${sender === "User" ? "user" : "agent"}`;
      msgElem.textContent = message;
      Object.assign(timeElem.style, { fontSize: "10px", color: "#6b7280", marginTop: "5px", textAlign: sender === "User" ? "right" : "left" });
      timeElem.className = "message-time";
      timeElem.textContent = timeStr;
      messagesContainer.append(msgElem, timeElem);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      this.chatHistory.push({
        sender,
        message,
        time: timeStr
      });
    },

    appendTypingIndicator() {
      const messagesContainer = document.getElementById("chat-messages");
      if (!messagesContainer || document.getElementById("typing-indicator")) return;
      const indicator = document.createElement("div");
      indicator.className = "message agent loading";
      indicator.id = "typing-indicator";
      indicator.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
      messagesContainer.appendChild(indicator);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    removeTypingIndicator() {
      const indicator = document.getElementById("typing-indicator");
      if (indicator) indicator.remove();
    }
  };

  global.ChatWidget = ChatWidget;
})(window);
