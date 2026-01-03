// Get the default headers of the request
const getHeaders = () => {
    return localStorage.getItem("token") ? {Authorization: "Basic " + localStorage.getItem("token")} : {};
}

// Run a plain request with all default values
export const request = async (path, method = "GET", body = {}, headers = {}, abort = true) => {
    const controller = new AbortController();
    if (abort) setTimeout(() => {controller.abort()}, 10000);


    return await fetch("/api/" + path, {
        headers: {...getHeaders(), ...headers}, method,
        body: method !== "GET" ? new URLSearchParams(body) : undefined,
        signal: controller.signal
    });
}

// Run a GET request and get the json of the response
export const jsonRequest = async (path, headers = {}) => {
    return (await request(path, "GET", null, headers)).json();
}

// Dispatches the provided command
export const dispatchCommand = (command) => {
    return postRequest("console", {command});
}

// Run a POST request and post some values
export const postRequest = async (path, body = {}, headers = {}) => {
    return await request(path, "POST", body, headers);
}

// Run a PUT request update a resource
export const putRequest = async (path, body = {}, headers = {}) => {
    return await request(path, "PUT", body, headers);
}

// Run a PATCH request update a resource
export const patchRequest = async (path, body = {}, headers = {}) => {
    return await request(path, "PATCH", body, headers);
}

// Run a DELETE request and delete a resource
export const deleteRequest = async (path, body = {}, headers = {}) => {
    return await request(path, "DELETE", body, headers);
}

// Download a specific file from the response output
export const downloadRequest = async (path, body = {}, headers = {}) => {
    const file = await request(path, "GET", body, headers);
    let element = document.createElement('a');
    let url = file.headers.get('Content-Disposition').split('filename=')[1];
    element.setAttribute("download", url.replaceAll("\"", ""));

    const blob = await file.blob();
    element.href = window.URL.createObjectURL(blob);
    document.body.appendChild(element);
    element.click();
    element.remove();
}

// Upload a file to the server with optional progress callback
export const uploadRequest = async (path, file, onProgress = null, headers = {}) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", "/api/" + path, true);

        const token = localStorage.getItem("token");
        if (token) {
            xhr.setRequestHeader("Authorization", "Basic " + token);
        }

        if (onProgress) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    onProgress(event.loaded, event.total);
                }
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve({status: xhr.status, ok: true});
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
        };

        xhr.onerror = () => reject(new Error("Upload failed"));

        let formData = new FormData();
        formData.append("file", file, file.name);
        xhr.send(formData);
    });
}