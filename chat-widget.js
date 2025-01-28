// chat-widget.js
(function (global) {
  const ChatWidget = {
    init: function (options) {
      const defaultOptions = {
        elementId: "chat-widget",
        apiEndpoint: "",
        allowFileUpload: true,
        allowEmojis: true,
        allowAudioCall: false,
        position: "bottom-right", // Available: 'bottom-left', 'bottom-right'
        iconColor: "#56a2ed",
        chatWindowColor: "#ffffff",
        fontColor: "#000000",
        availability: true, // If false, show contact form
      };

      this.options = { ...defaultOptions, ...options };
      this.container = document.getElementById(this.options.elementId);

      if (!this.container) {
        console.error("Chat widget container not found!");
        return;
      }

      this.renderIcon();
    },

    renderIcon: function () {
      const positionStyles =
        this.options.position === "bottom-left"
          ? "left: 10px; bottom: 10px;"
          : "right: 10px; bottom: 10px;";

      // Render the chat icon
      this.container.innerHTML = `
      <div class="chat-container" style="position: fixed; ${positionStyles}; display: flex; align-items: center;">
        <div class="chat-icon" style="cursor: pointer; background-color: ${this.options.iconColor}; color: white; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 50%; position: relative;">
          💬
        </div>
        <div class="chat-message" id="chat-message" style="background: white; color: black; padding: 8px 12px; border-radius: 15px; box-shadow: 0px 2px 5px rgba(0,0,0,0.2); margin-right: 10px; font-size: 14px; display: none; align-items: center;">
          Hello and welcome to Chat360 👋
          <button id="close-message" style="background: none; border: none; font-size: 16px; margin-left: 8px; cursor: pointer;">&times;</button>
        </div>
      </div>
    `;

      const chatIcon = this.container.querySelector(".chat-icon");
      chatIcon.addEventListener("click", () => this.renderChatWindow());

      const closeMessageButton = document.getElementById("close-message");
      closeMessageButton.addEventListener("click", () => {
        document.getElementById("chat-message").style.display = "none";
      });

      setTimeout(() => {
        const chatMessage = document.getElementById("chat-message");
        if(chatMessage) {
          chatMessage.style.display = "flex";
        }
      }, 2000);

      // Basic styling for chat icon
      const style = document.createElement("style");
      style.innerHTML = `
          .chat-icon:hover { opacity: 0.8; }
        `;
      document.head.appendChild(style);
    },

    renderChatWindow: function () {
      // Apply widget position
      const positionStyles =
        this.options.position === "bottom-left"
          ? "left: 10px; bottom: 10px;"
          : "right: 10px; bottom: 10px;";

      // Create chat widget structure
      this.container.innerHTML = `
          <div class="chat-widget" style="${positionStyles} background-color: ${
        this.options.chatWindowColor
      }; color: ${this.options.fontColor};">
            <div class="chat-header" style="background-color: ${
              this.options.iconColor
            }; display: flex; justify-content: space-between; align-items: center; padding: 15px;">
              <span>Chat</span>
              <button id="color-picker" style="background: none; border: none; font-size: 16px; cursor: pointer;">🎨</button>
              <button id="close-chat" style="background: none; border: none; font-size: 16px; cursor: pointer;">&times;</button>
            </div>
            <div class="chat-messages" id="chat-messages" style="display:flex; flex-direction:column;">
            <div class="message agent" style="text-align: left; align-self: flex-start; width: fit-content;">
              Hello! How can I help you?
            </div>
            <div class="message-time" style="font-size: 10px; margin-top:5px; color: #6b7280; align-self: flex-start;">${this.getMessageTime()}</div>

            <div class="message user" style="text-align: right; align-self: flex-end; width: fit-content;">
              I need assistance with my order.
            </div>
            <div class="message-time" style="font-size: 10px; margin-top:5px; color: #6b7280; align-self: flex-end;">${this.getMessageTime()}</div>

            <div class="message agent" style="text-align: left; align-self: flex-start; width: fit-content;">
              Sure! Can you please provide your order ID?
            </div>
            <div class="message-time" style="font-size: 10px; margin-top:5px; color: #6b7280; align-self: flex-start;">${this.getMessageTime()}</div>
            </div>
            ${
              this.options.availability
                ? this.chatInputTemplate()
                : this.contactFormTemplate()
            }
          </div>
        `;

        const colorPickerButton = document.getElementById("color-picker");
        const closeChatButton = document.getElementById("close-chat");
      
        colorPickerButton.addEventListener("click", () => this.showColorPicker());
        closeChatButton.addEventListener("click", () => this.renderIcon());
      
      // Add event listeners
      if (this.options.availability) {
        this.setupEventListeners();
      } else {
        this.setupContactFormListener();
      }

      // Basic styling (can be enhanced further)
      const style = document.createElement("style");
      style.innerHTML = `
          .chat-widget { position: fixed; border: 1px solid #ddd; border-radius: 5px; width: 360px; height: 500px; display: flex; flex-direction: column; }
          .chat-header { color: white; border-radius: 5px 5px 0 0; }
          .chat-messages { flex: 1; overflow-y: scroll; scrollbar-width: none; -ms-overflow-style: none; padding: 10px; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; display: flex; flex-direction: column; }
          .chat-messages::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Edge, and Opera */
          }
          .message { padding: 8px 10px; border-radius: 10px; width:fit-content; display: inline-block; margin-top: 5px; }
          .message.agent { background-color: #f1f1f1; color: #000; align-self: flex-start;}
          .message.user { background-color: ${this.options.iconColor}; color: white; align-self: flex-end;}
          .chat-input-container { display: flex; padding: 10px; gap: 5px; }
          #chat-input { flex: 1; resize: none; border: 1px solid #ddd; border-radius: 5px; padding: 5px; }
          .chat-actions { display: flex; align-items: center; gap: 5px; }
          .chat-actions button { cursor: pointer; background: ${this.options.iconColor}; color: white; border: none; border-radius: 5px; padding: 5px 10px; }
          .chat-actions button:hover { opacity: 0.8; }
          .contact-form { padding: 10px; }
          .contact-form input, .contact-form textarea { width: 100%; margin-bottom: 10px; padding: 5px; border: 1px solid #ddd; border-radius: 5px; }
          .contact-form button { width: 100%; background: ${this.options.iconColor}; color: white; border: none; border-radius: 5px; padding: 10px; }
          .contact-form button:hover { opacity: 0.8; }
        `;
      document.head.appendChild(style);
    },
    getMessageTime: function () {
      return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    chatInputTemplate: function () {
      return `
          <div class="chat-input-container">
            <textarea id="chat-input" placeholder="Type a message..."></textarea>
            <div class="chat-actions">
              ${
                this.options.allowEmojis
                  ? '<button id="emoji-picker">😊</button>'
                  : ""
              }
              ${
                this.options.allowFileUpload
                  ? '<input type="file" id="file-upload" style="display: none;" /><button id="upload-button">📁</button>'
                  : ""
              }
              ${
                this.options.allowAudioCall
                  ? '<button id="audio-call">🎤</button>'
                  : ""
              }
              <button id="send-message">Send</button>
            </div>
          </div>
        `;
    },

    contactFormTemplate: function () {
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

    setupEventListeners: function () {
      const sendMessageButton = document.getElementById("send-message");
      const chatInput = document.getElementById("chat-input");
      const messagesContainer = document.getElementById("chat-messages");
      const fileUploadInput = document.getElementById("file-upload");
      const uploadButton = document.getElementById("upload-button");
      const emojiPickerButton = document.getElementById("emoji-picker");

      // Send message
      sendMessageButton.addEventListener("click", () => {
        const message = chatInput.value.trim();
        if (message) {
          this.appendMessage("You", message);
          chatInput.value = "";
        }
      });

      // Handle file upload
      if (uploadButton && fileUploadInput) {
        uploadButton.addEventListener("click", () => fileUploadInput.click());
        fileUploadInput.addEventListener("change", (event) => {
          const file = event.target.files[0];
          if (file) {
            this.appendMessage("You", `Uploaded: ${file.name}`);
          }
        });
      }

      // Handle emoji picker
      if (emojiPickerButton) {
        emojiPickerButton.addEventListener("click", () => {
          const emoji = "😊"; // Basic example, replace with a full emoji picker integration.
          chatInput.value += emoji;
          chatInput.focus();
        });
      }
    },

    setupContactFormListener: function () {
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

    appendMessage: function (sender, message) {
      const messagesContainer = document.getElementById("chat-messages");
      const messageTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const messageElement = document.createElement("div");
      const messageTimeElement = document.createElement("div");

      messageElement.className = `message ${
        sender === "You" ? "user" : "agent"
      }`;
      messageElement.textContent = message;

      messageTimeElement.className = "message-time";
      messageTimeElement.textContent = messageTime;
      Object.assign(messageTimeElement.style, {
        fontSize: "10px",
        color: "#6b7280",
        marginTop: "5px",
        textAlign: "right",
      });

      messagesContainer.append(messageElement, messageTimeElement);

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },
  };

  // Expose to global scope
  global.ChatWidget = ChatWidget;
})(window);
