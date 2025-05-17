let allowedChannels = []
let lastChannelName = null

function removeSidebars(retries = 5) {
    const sidebars = document.querySelectorAll("#secondary")
    if (sidebars.length) {
        sidebars.forEach((el) => el.remove())
        console.log("Removed sidebar(s)")
    } else if (retries > 0) {
        setTimeout(() => removeSidebars(retries - 1), 500)
    }
}

function checkChannel() {
    const channelLink = document.querySelector("#owner #channel-name a")

    if (channelLink && channelLink.innerText.trim() !== "") {
        const channelName = channelLink.innerText.trim()

        if (channelName === lastChannelName) return
        lastChannelName = channelName

        console.log("Detected channel:", channelName)

        if (!allowedChannels.includes(channelName)) {
            console.log("Blocked channel. Redirecting...")
            window.location.href = "https://www.youtube.com"
            // document.body.innerHTML = `${channelName}`
        }
    }

    // remove sidebar with additional videos
    removeSidebars()
}

// Watch for DOM changes in the channel name container
function observeChannelChanges() {
    const channelContainer = document.querySelector("#channel-name")
    if (!channelContainer) return

    const observer = new MutationObserver(() => {
        checkChannel()
    })

    observer.observe(channelContainer, { childList: true, subtree: true })
    checkChannel() // Also check immediately
}

function startObserving() {
    // Observe full body for page transitions
    let lastUrl = location.href
    const pageObserver = new MutationObserver(() => {
        const currentUrl = location.href
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl

            if (currentUrl.includes("youtube.com/watch")) {
                setTimeout(() => observeChannelChanges(), 1000) // delay for DOM to load
            }
        }
    })
    pageObserver.observe(document.body, { childList: true, subtree: true })

    window.addEventListener("load", () => {
        if (location.href.includes("youtube.com/watch")) {
            setTimeout(() => observeChannelChanges(), 1000)
        }
    })
}

// Load allowed channels from storage and then start logic
chrome.storage.sync.get(
    "allowedChannels",
    ({ allowedChannels: storedChannels }) => {
        allowedChannels = (storedChannels || [])
            .filter((ch) => ch.active)
            .map((ch) => ch.name)

        console.log("Loaded allowed channels:", allowedChannels)

        // start logic!
        startObserving()
    }
)
