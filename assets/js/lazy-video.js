/**
 * Lazy Video Loading System
 * Carga videos de YouTube solo cuando son visibles o cuando el usuario hace click
 * Mejora dramáticamente el tiempo de carga inicial de la página
 */

class LazyVideo {
  constructor() {
    this.videos = document.querySelectorAll('.lazy-video');
    this.observers = new Map();
    this.init();
  }

  init() {
    // Verificar si el navegador soporta IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      // Fallback: cargar todos los videos inmediatamente
      this.loadAllVideos();
      return;
    }

    // Crear observer para cada video
    this.videos.forEach(video => {
      this.setupVideo(video);
    });
  }

  setupVideo(videoElement) {
    const videoId = videoElement.dataset.videoId;
    const videoParams = videoElement.dataset.videoParams || '';
    const isAutoplay = videoElement.dataset.autoplay === 'true';
    
    if (!videoId) return;

    // Crear thumbnail
    this.createThumbnail(videoElement, videoId);

    // TODOS los videos usan observer para carga automática cuando son visibles
    this.observeVideo(videoElement);
    
    // Si no es autoplay, también permitir click manual para carga inmediata
    if (!isAutoplay) {
      this.setupClickToLoad(videoElement);
    }
  }

  createThumbnail(videoElement, videoId) {
    // Usar thumbnail de YouTube que siempre existe (hqdefault)
    // Nota: maxresdefault.jpg solo existe para algunos videos
    const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    
    const isAutoplay = videoElement.dataset.autoplay === 'true';
    
    // Crear estructura del thumbnail
    const thumbnail = document.createElement('div');
    thumbnail.className = 'video-thumbnail';
    thumbnail.innerHTML = `
      <img src="${thumbnailUrl}" 
           alt="Video thumbnail"
           loading="lazy">
      ${!isAutoplay ? '<div class="play-button"><svg viewBox="0 0 68 48" width="68" height="48"><path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"></path><path d="M 45,24 27,14 27,34" fill="#fff"></path></svg></div>' : ''}
      <div class="video-loading">
        <div class="spinner"></div>
      </div>
    `;
    
    videoElement.appendChild(thumbnail);
  }

  setupClickToLoad(videoElement) {
    const playButton = videoElement.querySelector('.play-button');
    if (!playButton) return;

    playButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.loadVideo(videoElement);
    });
  }

  observeVideo(videoElement) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Video está visible, cargarlo
            this.loadVideo(videoElement);
            observer.unobserve(videoElement);
          }
        });
      },
      {
        // Cargar cuando el video esté a 200px de ser visible
        rootMargin: '200px',
        threshold: 0.1
      }
    );

    observer.observe(videoElement);
    this.observers.set(videoElement, observer);
  }

  loadVideo(videoElement) {
    // Verificar si ya está cargado
    if (videoElement.classList.contains('loaded')) {
      return;
    }
    
    const videoId = videoElement.dataset.videoId;
    let videoParams = videoElement.dataset.videoParams || '';
    const videoTitle = videoElement.dataset.videoTitle || 'Video';
    
    // Si no hay parámetros, agregar loop infinito para evitar tarjetas de YouTube
    if (!videoParams) {
      videoParams = `?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&loop=1&playlist=${videoId}`;
    }
    
    // Marcar como cargado inmediatamente para evitar doble carga
    videoElement.classList.add('loaded');
    
    // Mostrar loading
    const loading = videoElement.querySelector('.video-loading');
    if (loading) loading.style.display = 'flex';

    // Crear iframe
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}${videoParams}`;
    iframe.title = videoTitle;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    
    // Cuando el iframe carga, remover thumbnail
    iframe.onload = () => {
      const thumbnail = videoElement.querySelector('.video-thumbnail');
      if (thumbnail) {
        thumbnail.style.opacity = '0';
        setTimeout(() => thumbnail.remove(), 300);
      }
    };
    
    // Insertar iframe
    videoElement.appendChild(iframe);
  }

  loadAllVideos() {
    // Fallback para navegadores antiguos
    this.videos.forEach(video => this.loadVideo(video));
  }

  // Método público para destruir observers (útil para SPA)
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.lazyVideo = new LazyVideo();
  });
} else {
  window.lazyVideo = new LazyVideo();
}

