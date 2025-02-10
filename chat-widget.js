// chat-widget.js
(function (global) {
  const ChatWidget = {
    // Flag to ensure global styles are injected only once
    globalStylesInjected: false,

    // Initialize ChatWidget: merge options, find container, connect socket, inject styles, and render icon.
    init(options) {
      const defaultOptions = {
        elementId: "chat-widget",
        apiEndpoint: "",
        allowFileUpload: true,
        allowEmojis: true,
        allowAudioCall: false,
        position: "bottom-left",
        iconColor: "#56a2ed",
        chatWindowColor: "#ffffff",
        fontColor: "#000000",
        availability: true,
        socketServer: "http://localhost:5003",
      };
      this.options = { ...defaultOptions, ...options };

      // Get container element from DOM
      this.container = document.getElementById(this.options.elementId);
      if (!this.container) {
        console.error("Chat widget container not found!");
        return;
      }

      // Connect to the WebSocket server
      this.socket = io(this.options.socketServer);

      // Inject global styles and render the chat icon
      this.injectGlobalStyles();
      this.renderIcon();
    },

    // Return CSS position string based on widget's position.
    getPositionStyles() {
      return this.options.position === "bottom-left"
        ? "left: 10px; bottom: 10px;"
        : "right: 10px; bottom: 10px;";
    },

    // Inject a style block into the document head.
    injectStyle(cssText) {
      const style = document.createElement("style");
      style.innerHTML = cssText;
      document.head.appendChild(style);
    },

    // Consolidate and inject all global styles for the widget.
    injectGlobalStyles() {
      if (this.globalStylesInjected) return;
      const css = `
        /* Chat Widget Global Styles */
        .chat-icon:hover { opacity: 0.8; }
        .chat-widget { 
          position: fixed; 
          border: 1px solid #ddd; 
          border-radius: 5px; 
          width: 380px; 
          height: 550px; 
          display: flex; 
          flex-direction: column; 
        }
        .chat-header { color: white; border-radius: 5px 5px 0 0; }
        .chat-messages { 
          flex: 1; 
          overflow-y: scroll; 
          scrollbar-width: none; 
          -ms-overflow-style: none; 
          padding: 10px; 
          border-top: 1px solid #ddd; 
          display: flex; 
          flex-direction: column; 
        }
        .chat-messages::-webkit-scrollbar { display: none; }
        .message { 
          padding: 8px 10px; 
          border-radius: 10px; 
          max-width: 80%; 
          display: inline-block; 
          margin-top: 5px; 
        }
        .message.agent { background-color: #f1f1f1; color: #000; align-self: flex-start; }
        .message.user { 
          background-color: ${this.options.iconColor}; 
          color: white; 
          align-self: flex-end; 
          max-width: 80%; 
          word-break: break-all; 
        }
        .chat-input-container { display: flex; padding: 10px; gap: 5px; position: relative; }
        #chat-input { flex: 1; resize: none; border-radius: 5px; padding: 5px; overflow: auto; }
        #chat-input::-webkit-scrollbar { display: none; }
        .chat-actions { display: flex; }
        .chat-actions button { 
          cursor: pointer; 
          color: white; 
          border: none; 
          border-radius: 5px; 
          padding: 5px; 
          background: none; 
          opacity: 0.7; 
        }
        .chat-actions button:hover { opacity: 0.8; }
        .contact-form { padding: 10px; }
        .contact-form input, .contact-form textarea { 
          width: 100%; 
          margin-bottom: 10px; 
          padding: 10px; 
          border: 1px solid #ddd; 
          border-radius: 5px; 
          background-color: #fafafa;
          font-size: 14px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .contact-form input:focus, .contact-form textarea:focus { 
          border-color: #667eea; 
          box-shadow: 0 0 5px rgba(102, 126, 234, 0.5);
          outline: none;
        }
        .contact-form button { 
          width: 100%; 
          color: #fff; 
          background: ${this.options.iconColor}; 
          border: none; 
          border-radius: 5px; 
          padding: 10px; 
          font-size: 16px;
          cursor: pointer;
          opacity: 0.8;
          transition: background 0.3s ease;
        }
        .contact-form button:hover { 
          opacity:1;
          background: ${this.options.iconColor};
        }
        .emoji-picker { cursor: pointer; }
        .emoji-picker-container { 
          position: absolute; 
          bottom: 70px; 
          left: 20px; 
          z-index: 9999; 
          display: none; 
          border: 1px solid #ccc; 
          border-radius: 5px; 
          width: 340px; 
          height: 200px; 
          overflow: auto; 
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); 
          border-bottom: none; 
        }
        .emoji-picker-container #shadow-root .picker .favorites { display: none; }
        textarea { border: none; }
        textarea:focus { outline: none; border: none; }
        .chat-input-wrapper { 
          display: flex; 
          width: 100%; 
          padding: 3px 5px; 
          border: 1px solid #ddd; 
          border-radius: 5px; 
        }
        /* Typing indicator styles */
        .message.agent.loading .typing-indicator {
          display: flex;
          align-items: center;
        }
        .message.agent.loading .typing-indicator span {
          background-color: #ccc;
          border-radius: 50%;
          width: 8px;
          height: 8px;
          margin: 0 2px;
          animation: typing 1s infinite;
        }
        .message.agent.loading .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .message.agent.loading .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
          0% { opacity: 0.2; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
          100% { opacity: 0.2; transform: translateY(0); }
        }
      `;
      this.injectStyle(css);
      this.globalStylesInjected = true;
    },

    // Render chat icon and welcome message; reverse order if position is bottom-right.
    renderIcon() {
      const positionStyles = this.getPositionStyles();
      const isBottomRight = this.options.position === "bottom-right";
      this.container.innerHTML = `
        <div class="chat-container ${
          isBottomRight ? "bottom-right" : "bottom-left"
        }" style="position: fixed; ${positionStyles}; display: flex; align-items: center;">
          <div class="chat-icon" style="cursor: pointer; background-color: ${
            this.options.iconColor
          }; color: white; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 50%; position: relative;">
            💬
          </div>
          <div class="chat-message" id="chat-message" style="background: white; color: black; padding: 8px 12px; border-radius: 15px; box-shadow: 0px 2px 5px rgba(0,0,0,0.2); ${
            isBottomRight ? "margin-left: 10px;" : "margin-right: 10px;"
          } font-size: 14px; display: none; align-items: center;">
            Hello and welcome to Chat360 👋
            <button id="close-message" style="background: none; border: none; font-size: 16px; ${
              isBottomRight ? "margin-right: 8px;" : "margin-left: 8px;"
            } cursor: pointer;">&times;</button>
          </div>
        </div>
      `;
      if (isBottomRight) {
        this.container.querySelector(".chat-container").style.flexDirection =
          "row-reverse";
      }
      this.container
        .querySelector(".chat-icon")
        .addEventListener("click", () => this.renderChatWindow());
      document.getElementById("close-message").addEventListener("click", () => {
        document.getElementById("chat-message").style.display = "none";
      });
      setTimeout(() => {
        const chatMessage = document.getElementById("chat-message");
        if (chatMessage) chatMessage.style.display = "flex";
      }, 2000);
    },

    // Render the main chat window with header, messages, and input/contact form.
    renderChatWindow() {
      const positionStyles = this.getPositionStyles();
      this.container.innerHTML = `
        <div class="chat-widget" style="${positionStyles} background-color: ${
        this.options.chatWindowColor
      }; color: ${this.options.fontColor};">
          <div class="chat-header" style="background-color: ${
            this.options.iconColor
          }; display: flex; justify-content: space-between; align-items: center; padding: 10px 20px;">
            <div style="display: flex; align-items: center;">
              <div id="avatar-container" style="margin-right: 10px;">
                <img id="avatar" src="https://www.w3schools.com/w3images/avatar2.png" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
              </div>
              <div style="display: flex; flex-direction: column;">
                <span style="color: white; font-size: 18px; font-weight: bold;">ChatBot</span>
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
          <div class="chat-messages" id="chat-messages" style="display: flex; flex-direction: column;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="message agent">Hello! How can I help you?</div>
            </div>
            <div class="message-time" style="font-size: 10px; margin-top: 5px; color: #6b7280; align-self: flex-start;">
              ${this.getMessageTime()}
            </div>
          </div>
          ${
            this.options.availability
              ? this.chatInputTemplate()
              : this.contactFormTemplate()
          }
        </div>
      `;
      document
        .getElementById("close-chat")
        .addEventListener("click", () => this.renderIcon());
      if (this.options.availability) {
        this.setupEventListeners();
      } else {
        this.setupContactFormListener();
      }
    },

    // Return the current time formatted as HH:MM.
    getMessageTime() {
      return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    // Emit the user's message to the server and clear the input.
    sendMessage() {
      const chatInput = document.getElementById("chat-input");
      const message = chatInput.value.trim();
      if (message) {
        this.socket.emit("sendMessage", { sender: "User", message });
        chatInput.value = "";
      }
    },

    // Return the HTML template for the chat input area.
    chatInputTemplate() {
      return `
        <div class="chat-input-container">
          <div class="chat-input-wrapper">
            <textarea id="chat-input" placeholder="Type a message..."></textarea>
            <div class="chat-actions">
              ${
                this.options.allowEmojis
                  ? '<button id="emoji-picker"><img src="https://cdn-icons-png.flaticon.com/128/4989/4989500.png" alt="Emoji" width="20px" height="20px" /></button>'
                  : ""
              }
              ${
                this.options.allowFileUpload
                  ? '<input type="file" id="file-upload" style="display: none;" /><button id="upload-button"><img src="https://cdn-icons-png.flaticon.com/128/10847/10847957.png" alt="Upload" width="20px" height="20px"/></button>'
                  : ""
              }
              ${
                this.options.allowAudioCall
                  ? '<button id="audio-call">🎤</button>'
                  : ""
              }
              <button id="send-message"><img src="https://cdn-icons-png.flaticon.com/128/9333/9333991.png" alt="Send" width="20px" height="20px"/></button>
            </div>
          </div>
        </div>
      `;
    },

    // Return the HTML template for the contact form.
    contactFormTemplate() {
      return `
        <div class="contact-form">
          <h3>Contact Us</h3>
          <input type="text" id="contact-name" placeholder="Your Name" required />
          <input type="email" id="contact-email" placeholder="Your Email" required />
          <textarea id="contact-message" placeholder="Your Message" rows="4" required></textarea>
          <button id="submit-contact">Submit</button>
        </div>
      `;
    },

    // Set up event listeners for message sending, file uploads, and emoji picker.
    setupEventListeners() {
      const sendMessageButton = document.getElementById("send-message");
      const chatInput = document.getElementById("chat-input");
      const fileUploadInput = document.getElementById("file-upload");
      const uploadButton = document.getElementById("upload-button");
      const emojiPickerButton = document.getElementById("emoji-picker");

      sendMessageButton.addEventListener("click", () => {
        const message = chatInput.value.trim();
        if (!message) return;
      
        this.appendMessage("You", message);
        this.appendTypingIndicator();
      
        if (!this.threadId) {
          this.socket.emit("startChat", { sender: "User" });
          this.socket.once("chatStarted", (data) => {
            this.threadId = data.threadId;
            this.socket.emit("sendMessage", { sender: "User", message, threadId: this.threadId });
          });
        } else {
          this.socket.emit("sendMessage", { sender: "User", message, threadId: this.threadId });
        }
      
        chatInput.value = "";
      });
      
      // Listen for Enter key press (without Shift) in chat input to trigger send message.
      chatInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendMessageButton.click();
        }
      });

      this.socket.on("receiveMessage", (data) => {
        const { answer } = data;
        const typingIndicator = document.getElementById("typing-indicator");
        if (typingIndicator) typingIndicator.remove();
        this.appendMessage("ChatBot", answer);
      });

      if (uploadButton && fileUploadInput) {
        uploadButton.addEventListener("click", () => fileUploadInput.click());
        fileUploadInput.addEventListener("change", (event) => {
          const file = event.target.files[0];
          if (file) this.appendMessage("You", `Uploaded: ${file.name}`);
        });
      }

      // Set up emoji picker if allowed.
      if (this.options.allowEmojis) {
        this.setupEmojiPicker(chatInput, emojiPickerButton);
      }
    },

    // Set up the emoji picker by loading its script and configuring behavior.
    setupEmojiPicker(chatInput, emojiPickerButton) {
      const script = document.createElement("script");
      script.type = "module";
      script.src =
        "https://cdn.jsdelivr.net/npm/emoji-picker-element@1.26.1/picker.min.js";
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
          picker.style.display =
            picker.style.display === "none" || picker.style.display === ""
              ? "block"
              : "none";
        });
        document.addEventListener("click", (event) => {
          if (
            picker.style.display === "block" &&
            !picker.contains(event.target) &&
            event.target !== emojiPickerButton
          ) {
            picker.style.display = "none";
          }
        });
        picker.addEventListener("emoji-click", (event) => {
          chatInput.value += event.detail.unicode;
        });
      };
      document.body.appendChild(script);
    },

    // Set up the contact form submission listener.
    setupContactFormListener() {
      const submitButton = document.getElementById("submit-contact");
      submitButton.addEventListener("click", () => {
        const name = document.getElementById("contact-name").value.trim();
        const email = document.getElementById("contact-email").value.trim();
        const message = document.getElementById("contact-message").value.trim();
        if (name && email && message) {
          console.log("Contact form submitted:", { name, email, message });
          alert("Thank you! We will get back to you soon.");
          document.querySelector(".contact-form").reset();
        } else {
          alert("Please fill out all fields.");
        }
      });
    },

    // Append a message with timestamp; time aligned right for user, left for agent.
    appendMessage(sender, message) {
      const messagesContainer = document.getElementById("chat-messages");
      const messageTime = this.getMessageTime();
      const messageElement = document.createElement("div");
      const messageTimeElement = document.createElement("div");
      messageElement.className = `message ${
        sender === "You" ? "user" : "agent"
      }`;
      messageElement.textContent = message;
      const alignment = sender === "You" ? "right" : "left";
      Object.assign(messageTimeElement.style, {
        fontSize: "10px",
        color: "#6b7280",
        marginTop: "5px",
        textAlign: alignment,
      });
      messageTimeElement.className = "message-time";
      messageTimeElement.textContent = messageTime;
      messagesContainer.append(messageElement, messageTimeElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    // Append a typing indicator (animated dots) to the chat messages.
    appendTypingIndicator() {
      const messagesContainer = document.getElementById("chat-messages");
      const loadingIndicator = document.createElement("div");
      loadingIndicator.classList.add("message", "agent", "loading");
      loadingIndicator.id = "typing-indicator";
      loadingIndicator.innerHTML = `
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;
      messagesContainer.appendChild(loadingIndicator);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },
  };

  // Expose ChatWidget to the global scope
  global.ChatWidget = ChatWidget;
})(window);
