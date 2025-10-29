// Robust script.js for ai_gallery_search
// - Uploads files (key name 'file') to /upload
// - Sends JSON search to /search
// - Renders results (images/videos) from /uploads/<filename>
// - Works with several possible HTML id names (safe fallback)

(function () {
  // Helper to find element by a list of possible ids
  function findOne(possibleIds) {
    for (const id of possibleIds) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  }

  // Try multiple common IDs used in different templates we've exchanged
  const fileInput = findOne(['fileInput', 'fileUpload', 'file', 'fileUploadInput']) ||
                    document.querySelector('input[type="file"]');

  const uploadBtn = findOne(['uploadBtn', 'uploadButton', 'upload-btn', 'uploadBtnMain']) ||
                    document.querySelector('button[data-upload]');

  const uploadStatus = findOne(['uploadStatus', 'selectedCount']) || (() => {
    const span = document.createElement('span');
    span.id = 'uploadStatus';
    if (uploadBtn && uploadBtn.parentNode) uploadBtn.parentNode.appendChild(span);
    return document.getElementById('uploadStatus');
  })();

  const searchInput = findOne(['searchInput', 'search-box', 'search-box', 'searchInputBox']) ||
                      document.querySelector('input[type="search"], input[placeholder*="Search"]');

  const searchBtn = findOne(['searchBtn', 'searchButton', 'search-btn', 'search-btn-main']) ||
                    document.querySelector('button[data-search]');

  const resultsDiv = findOne(['results', 'results-grid', 'results-container']) ||
                     (() => {
                       let r = document.getElementById('results');
                       if (!r) {
                         r = document.createElement('div');
                         r.id = 'results';
                         document.body.appendChild(r);
                       }
                       return r;
                     })();

  console.log('script.js initialized. Elements:', {
    fileInput: !!fileInput,
    uploadBtn: !!uploadBtn,
    uploadStatus: !!uploadStatus,
    searchInput: !!searchInput,
    searchBtn: !!searchBtn,
    resultsDiv: !!resultsDiv
  });

  // Safety checks
  if (!fileInput) console.warn('No file input found. Add <input type="file" id="fileInput" multiple>');
  if (!uploadBtn) console.warn('No upload button found. Add a button with id="uploadBtn"');
  if (!searchInput) console.warn('No search input found. Add <input id="searchInput">');
  if (!searchBtn) console.warn('No search button found. Add a button with id="searchBtn"');

  // Ensure fileInput is multiple
  if (fileInput && !fileInput.hasAttribute('multiple')) {
    fileInput.setAttribute('multiple', '');
  }

  // Click upload button -> open file picker
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });
  }

  // When files selected, automatically upload (or you can choose to upload via separate button)
  if (fileInput) {
    fileInput.addEventListener('change', async () => {
      const files = fileInput.files;
      if (!files || files.length === 0) {
        uploadStatus.textContent = 'No files selected';
        return;
      }

      console.log('Files selected:', files);
      uploadStatus.textContent = `Uploading ${files.length} file(s)...`;

      const formData = new FormData();
      // Append with key 'file' to match server code: request.files.getlist('file')
      for (const f of files) {
        formData.append('file', f, f.name);
      }

      try {
        const resp = await fetch('/upload', { method: 'POST', body: formData });
        const data = await resp.json();
        console.log('/upload response:', data);
        if (resp.ok) {
          uploadStatus.textContent = data.message || `Uploaded ${files.length} file(s)`;
        } else {
          uploadStatus.textContent = data.message || 'Upload failed';
        }
      } catch (err) {
        console.error('Upload error:', err);
        uploadStatus.textContent = 'Error uploading files (see console)';
      }
    });
  }

  // Search button click -> send JSON to /search
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', async () => {
      const query = (searchInput.value || '').trim();
      if (!query) {
        alert('Please enter a search query.');
        return;
      }

      console.log('Searching for:', query);
      resultsDiv.innerHTML = '<p>Searching…</p>';

      try {
        const resp = await fetch('/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });

        const data = await resp.json();
        console.log('/search response:', data);

        // Depending on backend shape, support both { matches: [...] } and { results: [...] }
        const results = data.matches || data.results || [];
        renderResults(results);
      } catch (err) {
        console.error('Search error:', err);
        resultsDiv.innerHTML = '<p>Error during search (see console)</p>';
      }
    });
  }

  // Render results (supports objects with url/filename/score or plain strings)
  function renderResults(results) {
    resultsDiv.innerHTML = '';
    if (!results || results.length === 0) {
      resultsDiv.innerHTML = '<p>No matches found.</p>';
      return;
    }

    results.forEach(item => {
      // Accept several formats:
      // { filename, url, similarity } or { filename, similarity } or string (url)
      let filename = null, url = null, score = null;
      if (typeof item === 'string') {
        url = item;
        filename = item.split('/').pop();
      } else {
        filename = item.filename || item.name || null;
        url = item.url || (filename ? `/uploads/${filename}` : null) || (filename ? `/static/uploads/${filename}` : null);
        score = item.similarity ?? item.score ?? null;
      }

      const card = document.createElement('div');
      card.className = 'result-card';
      card.style.margin = '8px';
      card.style.width = '220px';

      const ext = filename ? filename.split('.').pop().toLowerCase() : '';
      if (['mp4','mov','webm','avi','mkv'].includes(ext)) {
        const vid = document.createElement('video');
        vid.src = url;
        vid.controls = true;
        vid.style.width = '100%';
        vid.style.borderRadius = '8px';
        card.appendChild(vid);
      } else {
        const img = document.createElement('img');
        img.src = url;
        img.alt = filename || '';
        img.style.width = '100%';
        img.style.height = '160px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        card.appendChild(img);
      }

      const cap = document.createElement('p');
      cap.textContent = filename + (score != null ? ` — ${score.toFixed(2)}` : '');
      cap.style.fontSize = '0.9rem';
      cap.style.margin = '8px 0 0 0';
      cap.style.textAlign = 'center';
      cap.style.wordBreak = 'break-word';
      card.appendChild(cap);

      resultsDiv.appendChild(card);
    });
  }

  // Expose utility for manual testing in console
  window._aiGallery = {
    renderResults,
    uploadStatus,
    fileInput,
    searchInput,
    resultsDiv
  };

})(); 
