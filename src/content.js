let allowedChannels = []
let lastChannelName = null

function removeSidebars() {
    const sidebars = document.querySelectorAll("#secondary")
    if (sidebars.length) {
        sidebars.forEach((el) => el.remove())
        console.log("Removed sidebar(s)")
    }
}

function checkChannel() {
    const channelLink = document.querySelector("#owner #channel-name a")
    if (channelLink && channelLink.innerText.trim() !== "") {
        const channelName = channelLink.innerText.trim()

        if (channelName === lastChannelName) return // no change
        lastChannelName = channelName

        console.log("Detected channel:", channelName)

        if (!allowedChannels.includes(channelName)) {
            console.log("Blocked channel. Redirecting...")
            console.log({ channelName })
            window.location.href = "https://www.youtube.com"
            return
        }
    }

    removeSidebars()
}

function waitForChannelName(timeout = 5000) {
    return new Promise((resolve, reject) => {
        const interval = 100
        let elapsed = 0

        const check = () => {
            const channelLink = document.querySelector("#owner #channel-name a")
            if (channelLink && channelLink.innerText.trim() !== "") {
                resolve(channelLink)
            } else if ((elapsed += interval) >= timeout) {
                reject("Channel name not found in time")
            } else {
                setTimeout(check, interval)
            }
        }

        check()
    })
}

function onNavigation() {
    waitForChannelName()
        .then(() => {
            checkChannel()
        })
        .catch((err) => {
            console.warn("Failed to detect channel name:", err)
        })
}

function startObservingPageChanges() {
    const pageManager = document.querySelector("#page-manager")
    if (!pageManager) {
        console.warn("Page manager container not found")
        return
    }

    const observer = new MutationObserver(() => {
        onNavigation()
    })

    observer.observe(pageManager, { childList: true, subtree: true })
}

function patchHistoryAndListen() {
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    function dispatchLocationChange() {
        window.dispatchEvent(new Event("locationchange"))
    }

    history.pushState = function (...args) {
        originalPushState.apply(this, args)
        dispatchLocationChange()
    }

    history.replaceState = function (...args) {
        originalReplaceState.apply(this, args)
        dispatchLocationChange()
    }

    window.addEventListener("popstate", dispatchLocationChange)
    window.addEventListener("locationchange", onNavigation)
    window.addEventListener("yt-navigate-finish", onNavigation)
}

/**
 * Waits for allowedChannels data in chrome.storage.sync until
 * it is non-empty or retries exhaust.
 * Resolves with allowedChannels array or empty array if timeout.
 */
function waitForAllowedChannels(retries = 10, delay = 500) {
    return new Promise((resolve) => {
        function tryGet() {
            chrome.storage.sync.get("allowedChannels", (obj) => {
                const channels = obj.allowedChannels
                if (channels && channels.length > 0) {
                    resolve(channels)
                } else if (retries > 0) {
                    retries--
                    setTimeout(tryGet, delay)
                } else {
                    resolve([]) // fallback to empty if not found after retries
                }
            })
        }
        tryGet()
    })
}

async function start() {
    console.log("START")

    // Debug: log all storage keys
    chrome.storage.sync.get(null, (allItems) => {
        console.log("All items in sync storage:", allItems)
    })

    // Wait for allowedChannels to be populated before proceeding
    const storedChannels = await waitForAllowedChannels()
    allowedChannels = storedChannels
        .filter((ch) => ch.active)
        .map((ch) => ch.name)

    console.log("Loaded allowed channels:", allowedChannels)

    patchHistoryAndListen()
    startObservingPageChanges()
    onNavigation() // initial check
}

start()
