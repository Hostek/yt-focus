// tmp channel list
const allowedChannels = ["Veritasium", "Kurzgesagt – In a Nutshell"];
let lastChannelName = null;

function checkChannel() {
    const channelLink = document.querySelector("#channel-name a");

    if (channelLink && channelLink.innerText.trim() !== "") {
        const channelName = channelLink.innerText.trim();

        if (channelName === lastChannelName) return;
        lastChannelName = channelName;

        console.log("Detected channel:", channelName);

        if (!allowedChannels.includes(channelName)) {
            console.log("Blocked channel. Redirecting...");
            window.location.href = "https://www.youtube.com";
        }
    }
}

// Watch for DOM changes in the channel name container
function observeChannelChanges() {
    const channelContainer = document.querySelector("#channel-name");
    if (!channelContainer) return;

    const observer = new MutationObserver(() => {
        checkChannel();
    });

    observer.observe(channelContainer, { childList: true, subtree: true });
    checkChannel(); // Also check immediately
}

// Observe full body for page transitions
let lastUrl = location.href;
const pageObserver = new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;

        if (currentUrl.includes("youtube.com/watch")) {
            setTimeout(() => observeChannelChanges(), 1000); // delay for DOM to load
        }
    }
});
pageObserver.observe(document.body, { childList: true, subtree: true });

window.addEventListener("load", () => {
    if (location.href.includes("youtube.com/watch")) {
        setTimeout(() => observeChannelChanges(), 1000);
    }
});
