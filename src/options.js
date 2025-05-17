// Helper to load allowed channels
function loadChannels() {
    chrome.storage.sync.get(["allowedChannels"], (result) => {
        const channels = result.allowedChannels || []
        const list = document.getElementById("channel-list")
        list.innerHTML = ""

        channels.forEach((channel, index) => {
            const li = document.createElement("li")
            li.className = "channel-item" + (channel.active ? "" : " inactive")

            const nameSpan = document.createElement("span")
            nameSpan.textContent = channel.name
            nameSpan.className = "channel-name"

            const actions = document.createElement("div")
            actions.className = "actions"

            const toggleBtn = document.createElement("button")
            toggleBtn.textContent = channel.active ? "Unmark" : "Mark"
            toggleBtn.onclick = () => toggleChannel(index)

            const deleteBtn = document.createElement("button")
            deleteBtn.textContent = "Delete"
            deleteBtn.onclick = () => deleteChannel(index)

            actions.appendChild(toggleBtn)
            actions.appendChild(deleteBtn)

            li.appendChild(nameSpan)
            li.appendChild(actions)

            list.appendChild(li)
        })
    })
}

document.getElementById("add-button").addEventListener("click", () => {
    const input = document.getElementById("new-channel")
    const name = input.value.trim()
    if (!name) return

    chrome.storage.sync.get(["allowedChannels"], (result) => {
        const channels = result.allowedChannels || []
        if (channels.find((c) => c.name.toLowerCase() === name.toLowerCase())) {
            alert("Channel already exists.")
            return
        }
        channels.push({ name, active: true })
        chrome.storage.sync.set({ allowedChannels: channels }, loadChannels)
        input.value = ""
    })
})

function deleteChannel(index) {
    chrome.storage.sync.get(["allowedChannels"], (result) => {
        const channels = result.allowedChannels || []
        channels.splice(index, 1)
        chrome.storage.sync.set({ allowedChannels: channels }, loadChannels)
    })
}

function toggleChannel(index) {
    chrome.storage.sync.get(["allowedChannels"], (result) => {
        const channels = result.allowedChannels || []
        channels[index].active = !channels[index].active
        chrome.storage.sync.set({ allowedChannels: channels }, loadChannels)
    })
}

document.addEventListener("DOMContentLoaded", loadChannels)

// Theme toggle logic (probably we want to export it to other file ...)
const themeToggle = document.getElementById("theme-toggle")

themeToggle.addEventListener("click", () => {
    const body = document.body
    const isLight = body.classList.toggle("light")
    themeToggle.textContent = isLight ? "Dark Mode" : "Light Mode"
    chrome.storage.sync.set({ theme: isLight ? "light" : "dark" })
})

// Load theme on start
document.addEventListener("DOMContentLoaded", () => {
    loadChannels()
    chrome.storage.sync.get("theme", ({ theme }) => {
        if (theme === "light") {
            document.body.classList.add("light")
            themeToggle.textContent = "Dark Mode"
        }
    })
})
