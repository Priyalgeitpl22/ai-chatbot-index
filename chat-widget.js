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
        if (chatMessage) {
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
            }; display: flex; justify-content: space-between; align-items: center; padding: 20px;">
            <div style="display: flex; align-items: center;">
            <div id="avatar-container" style="margin-right: 10px;">
            <img id="avatar" src="https://www.w3schools.com/w3images/avatar2.png" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; align-self: flex-start;">
          </div>
          <div style="display: flex; flex-direction: column;">
              <span style="color: white; font-size: 18px; font-weight:bold">ChatBot</span>
              <div style="display:flex; align-items: center; gap: 5px; font-size: 12px; color: #fff;"><div style="width:8px; height:8px; border-radius:50%; background-color: rgb(16, 185, 129);"></div>Online</div>
              </div>
              </div>
              <button id="close-chat" style="background: none;color: white; border: none; font-size: 14px; cursor: pointer;">
              <img src="https://cdn-icons-png.flaticon.com/128/8213/8213476.png" alt="img" width="16px" />
              </button>
             
              </div>
            <div class="chat-messages" id="chat-messages" style="display:flex; flex-direction:column;">
            <div style="display: flex; align-items: center; gap: 10px;">
            <img src="https://www.w3schools.com/w3images/avatar2.png" 
                 alt="Avatar" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">
            <div class="message agent">Hello! How can I help you?</div>
          </div>
            <div class="message-time" style="font-size: 10px; margin-top:5px; color: #6b7280; align-self: flex-start;">${this.getMessageTime()}</div>

            <div class="message user" style="text-align: right; align-self: flex-end; width: fit-content;">
              I need assistance with my order.
            </div>
            <div class="message-time" style="font-size: 10px; margin-top:5px; color: #6b7280; align-self: flex-end;">${this.getMessageTime()}</div>

            <div style="display: flex; align-items: center; gap: 10px;">
            <img src="https://www.w3schools.com/w3images/avatar2.png" 
                 alt="Avatar" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">
            <div class="message agent">Sure! Can you please provide your order ID?</div>
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

      const closeChatButton = document.getElementById("close-chat");

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
          .chat-messages { flex: 1; overflow-y: scroll; scrollbar-width: none; -ms-overflow-style: none; padding: 10px; border-top: 1px solid #ddd; display: flex; flex-direction: column; }
          .chat-messages::-webkit-scrollbar { display: none;}
          .message { padding: 8px 10px; border-radius: 10px; width:fit-content; display: inline-block; margin-top: 5px; }
          .message.agent { background-color: #f1f1f1; color: #000; align-self: flex-start;}
          .message.user { background-color: ${this.options.iconColor}; color: white; align-self: flex-end; max-width: 80%; word-break: break-all; }
          .chat-input-container { display: flex; padding: 10px; gap: 5px; position: relative; }
          #chat-input { flex: 1; resize: none; border-radius: 5px; padding: 5px; overflow:auto; }
          #chat-input::-webkit-scrollbar {display: none;}
          .chat-actions { display: flex;}
          .chat-actions button { cursor: pointer; color: white;  border: none; border-radius: 5px; padding: 5px 5px; background:none; opacity: 0.7; }
          .chat-actions button:hover { opacity: 0.8; }
          .contact-form { padding: 10px; }
          .contact-form input, .contact-form textarea { width: 100%; margin-bottom: 10px; padding: 5px; border: 1px solid #ddd; border-radius: 5px; }
          .contact-form button { width: 100%;  color: white; border: none; border-radius: 5px; padding: 10px; }
          .contact-form button:hover { opacity: 1;}
          .emoji-picker{cursor: pointer;}
          .emoji-picker-container{position: absolute;bottom: 70px;left: 20px;z-index: 9999;display: none;border: 1px solid #ccc;border-radius: 5px; width: 340px;height: 200px;overflow: auto;box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);border-bottom:none;}
          .emoji-picker-container #shadow-root .picker .favorites {display: none;} 
          textarea{border:none;}
          textarea:focus{outline: none;border:none;}   
          .chat-input-wrapper{ display:flex; width:100%; padding:3px 5px; border:1px solid #ddd; border-radius:5px; }   
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
          <div class="chat-input-wrapper">
            <textarea id="chat-input" placeholder="Type a message..."></textarea>
            <div class="chat-actions">
              ${
                this.options.allowEmojis
                  ? '<button id="emoji-picker"><img src="	https://cdn-icons-png.flaticon.com/128/4989/4989500.png" alt="Emoji" width="20px" height="20px" /></button>'
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

      // Load Emoji Picker from CDN
      const script = document.createElement("script");
      script.type = "module";
      script.src =
        "https://cdn.jsdelivr.net/npm/emoji-picker-element@1.26.1/picker.min.js";

      script.onload = () => {
        // Create and apply the emoji picker with a CSS class
        const picker = document.createElement("emoji-picker");
        picker.classList.add("emoji-picker-container");

        document.body.appendChild(picker);

        const emojiPicker = document.querySelector(".emoji-picker-container");
        if (emojiPicker) {
          emojiPicker.style.setProperty("--emoji-size", "1.1rem"); // Adjust emoji size
          emojiPicker.style.setProperty("--num-columns", "9"); // Adjust number of columns
          emojiPicker.style.setProperty("--background", "#f5f5f5");
          emojiPicker.style.setProperty("--border-color", "none");
          emojiPicker.style.setProperty("--button-active-background", "#999");
          emojiPicker.style.setProperty("--button-hover-background", "#d9d9d9");
        }

        const shadowRoot = emojiPicker.shadowRoot;

        if (shadowRoot) {
          // Find the .favorites section inside the shadow root
          const favoritesSection = shadowRoot.querySelector(".favorites");

          if (favoritesSection) {
            favoritesSection.style.display = "none";
          }

          const tabPanel = shadowRoot.querySelector(".tabpanel");
          if (tabPanel) {
            const style = document.createElement("style");
            style.innerHTML = `
            .tabpanel::-webkit-scrollbar {
              width: 5px; 
          }
          .tabpanel::-webkit-scrollbar-track {
              background-color: #f1f1f1; 
          }
          .tabpanel::-webkit-scrollbar-thumb {
              background-color: #888;
              border-radius: 10px; 
          }
          .tabpanel::-webkit-scrollbar-thumb:hover {
              background-color: #555; 
          }
            `;
            shadowRoot.appendChild(style);
          }
          

        }
        // Toggle picker visibility
        emojiPickerButton.addEventListener("click", (event) => {
          event.stopPropagation(); // Prevents event bubbling
          picker.style.display =
            picker.style.display === "none" || picker.style.display === ""
              ? "block"
              : "none";
        });

        // Close picker when clicking outside
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
          const emoji = event.detail.unicode; // The selected emoji
          chatInput.value += emoji; // Append the emoji to the chat input
        });
      };

      document.body.appendChild(script);
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
      const messageTime = this.getMessageTime();

      const messageWrapper = document.createElement("div");
      messageWrapper.style.display = "flex";
      messageWrapper.style.alignItems = "center";
      messageWrapper.style.gap = "10px";
    
      // Avatar for agent messages
      if (sender !== "You") {
        const avatarElement = document.createElement("img");
        avatarElement.src = "https://www.w3schools.com/w3images/avatar2.png";
        avatarElement.alt = "Avatar";
        avatarElement.style.width = "30px";
        avatarElement.style.height = "30px";
        avatarElement.style.borderRadius = "50%";
        avatarElement.style.objectFit = "cover";
    
        messageWrapper.appendChild(avatarElement);
      }

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
