document.addEventListener("DOMContentLoaded", () => {
  const socket = io(); // connect to server
  const messagesEl = document.getElementById("messages");
  const form = document.getElementById("messageForm");
  const input = document.getElementById("messageInput");
  const usernameInput = document.getElementById("username");
  const subtitle = document.getElementById("subtitle");

  usernameInput.addEventListener("input", () => {
    const name = usernameInput.value.trim() || "Anonymous";
    subtitle.textContent = `You are appearing as ${name}`;
  });

  async function loadMessages() {
    try {
      const res = await fetch("/messages");
      const arr = await res.json();
      arr.forEach(addMessageToDOM);
      scrollToBottom();
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  }

  function addMessageToDOM(msg) {
    // msg: { id, username, text, created_at }
    const row = document.createElement("div");
    row.className =
      "msg-row " + (isMine(msg) ? "msg-right outgoing" : "msg-left incoming");

    const avatar = document.createElement("img");
    avatar.className = "avatar";
    const seed = encodeURIComponent((msg.username || "Anon").slice(0, 6));
    avatar.src = `https://i.pravatar.cc/40?u=${seed}`;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    if (!isMine(msg)) {
      const nameEl = document.createElement("div");
      nameEl.className = "name";
      nameEl.textContent = msg.username || "Anonymous";
      bubble.appendChild(nameEl);
    }

    const textEl = document.createElement("div");
    textEl.className = "text";
    textEl.textContent = msg.text;
    bubble.appendChild(textEl);

    const meta = document.createElement("div");
    meta.className = "meta";
    const dt = new Date(msg.created_at);
    meta.textContent = dt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    bubble.appendChild(meta);

    if (isMine(msg)) {
      row.appendChild(bubble);
      row.appendChild(avatar);
    } else {
      row.appendChild(avatar);
      row.appendChild(bubble);
    }

    messagesEl.appendChild(row);
  }

  function isMine(msg) {
    const current = (usernameInput.value || "").trim() || "Anonymous";
    return (msg.username || "Anonymous") === current;
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight + 200;
  }

  socket.on("newMessage", (msg) => {
    addMessageToDOM(msg);
    scrollToBottom();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const username = (usernameInput.value || "").trim() || "Anonymous";

    socket.emit("sendMessage", { username, text });

    input.value = "";
    input.focus();
  });

  loadMessages();
});
