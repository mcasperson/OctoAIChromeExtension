// A regex that matches the ui of an Octopus server
const OctopusServerUrlRegex = /https:\/\/.+?\/app#\/Spaces-.*/

chrome.action.onClicked.addListener((tab) => {

});

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        chrome.tabs.query({windowId: tab.windowId})
            .then(tabs => {
                tabs.forEach(tab => {
                    if (tab.url.match(OctopusServerUrlRegex)) {
                        try {
                            chrome.scripting.executeScript({
                                target: {tabId: tab.id},
                                files: ['marked.min.js']
                            });
                            chrome.scripting.executeScript({
                                target: {tabId: tab.id},
                                files: ['purify.min.js']
                            });
                            chrome.scripting.executeScript({
                                target: {tabId: tab.id},
                                files: ['content.js']
                            });
                        } catch {
                            // probably an invalid URL
                        }
                    }
                })
            })
    }
})

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        if (request.action === 'prompt') {
            headers = {
                'Content-Type': 'application/json',
                'X-Octopus-Server': request.serverUrl
            }

            if (request.apiKey) {
                headers['X-Octopus-ApiKey'] = request.apiKey
            }

            if (request.accessToken) {
                headers['X-Octopus-AccessToken'] = request.accessToken
            }

            fetch('https://aiagent.octopus.com/api/form_handler', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({"messages": [{"content": request.prompt}]})
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`OctoAI API call failed: ${response.status} ${response.statusText}`);
                    }
                    return response.text()
                })
                .then(text => {
                    sendResponse({response: text})
                })
                .catch(error => {
                    sendResponse({error: error})
                });
        } else if (request.action === 'getPrompts') {
            fetch('https://raw.githubusercontent.com/OctopusSolutionsEngineering/OctoAIChromeExtension/main/promptsv2.json')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`OctoAI API call failed: ${response.status} ${response.statusText}`);
                    }
                    return response.json()
                })
                .then(json => sendResponse({response: json}))
                .catch(error => {
                    sendResponse({error: error})
                });
        }

        return true;
    }
);
