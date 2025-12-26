const API_KEY="0e33c92186263620ce8c7f6b8fb35b00"
const API_URL="https://api.themoviedb.org/3"
const IMAGE_BASE_URL="https://image.tmdb.org/t/p/w500"
const FALLBACK_IMAGE_URL="https://dummyimage.com/200x300/333/fff.png&text=No+Cover"
const searchInput=document.getElementById("search")
const resultsContainer=document.querySelector(".results")
const searchInfo=document.getElementById("search-info")
const loadMoreBtn=document.getElementById("loadMoreBtn")
const endMessage=document.getElementById("endMessage")
const popularContainer=document.querySelector(".popular-movies")
const topRatedContainer=document.querySelector(".top-rated-movies")
const upcomingContainer=document.querySelector(".upcoming-movies")
const favoritesContainer=document.querySelector(".favorites-movies")
const recommendationsContainer=document.querySelector(".recommendations")
const otherSections=document.getElementById("other-sections")
const searchResultsSection=document.getElementById("search-results")
const overlay=document.getElementById("overlay")
const closeBtn=document.getElementById("close-btn")
const loadingScreen=document.getElementById("loading")
const noMoviesMessage=document.getElementById("no-movies")
let searchAbortController=null
let currentSearchQuery=""
let currentPage=1
let totalPages=1
let searchDisplayedCount=0

async function fetchMovies(url,container,showLoading=true,signal,requestedQuery="",append=false,onComplete=null){
  if(showLoading) loadingScreen.style.display="flex"
  try {
    const response = await fetch(url,{signal})
    const data = await response.json()
    if(container===resultsContainer && currentSearchQuery!==requestedQuery) return
    if(requestedQuery){
      totalPages = data.total_pages
      searchDisplayedCount = append ? searchDisplayedCount + data.results.length : data.results.length
      updateSearchInfo(searchDisplayedCount,data.total_results)
      if(currentPage < totalPages){
        loadMoreBtn.style.display="block"
        endMessage.style.display="none"
      } else {
        loadMoreBtn.style.display="none"
        endMessage.style.display="block"
      }
    }
    if(container===resultsContainer){
      noMoviesMessage.style.display = data.results.length===0 && !append ? "block" : "none"
      updateContainerWithAnimation(container,()=>displayMovies(data.results,container,append))
    } else {
      updateContainerWithAnimation(container,()=>displayMovies(data.results,container,append))
    }
    if(typeof onComplete==="function") onComplete(data.results)
  } catch(error) {
    if(error.name!=="AbortError") alert("Failed to fetch movies.")
  } finally {
    loadingScreen.style.display="none"
  }
}

function updateContainerWithAnimation(container,updateCallback){
  container.style.opacity=0
  setTimeout(()=>{
    updateCallback()
    container.style.opacity=1
  },300)
}

function displayMovies(movies,container,append=false){
  if(!append) container.innerHTML=""
  movies.forEach(movie=>{
    const movieDiv=document.createElement("div")
    movieDiv.classList.add("movie")
    const movieImage=document.createElement("img")
    movieImage.src=movie.poster_path?`${IMAGE_BASE_URL}${movie.poster_path}`:FALLBACK_IMAGE_URL
    movieImage.onerror=function(){
      this.onerror=null
      this.src=FALLBACK_IMAGE_URL
    }
    const movieInfo=document.createElement("div")
    movieInfo.classList.add("movie-info")
    const movieTitle=document.createElement("h3")
    movieTitle.textContent=movie.title
    const movieRating=document.createElement("div")
    movieRating.classList.add("rating")
    movieRating.textContent=`⭐ ${movie.vote_average.toFixed(1)}`
    movieInfo.appendChild(movieTitle)
    movieInfo.appendChild(movieRating)
    movieDiv.appendChild(movieImage)
    movieDiv.appendChild(movieInfo)
    const favoriteIcon=document.createElement("i")
    favoriteIcon.classList.add("fas","fa-heart","favorite-icon")
    if(isFavorite(movie.id)) favoriteIcon.classList.add("favorited")
    favoriteIcon.addEventListener("click",e=>{
      e.stopPropagation()
      toggleFavorite(movie,favoriteIcon)
    })
    movieDiv.appendChild(favoriteIcon)
    container.appendChild(movieDiv)
    movieDiv.addEventListener("click",()=>show(movie.title,movie.overview,movie.id))
  })
}

function updateSearchInfo(displayedCount,totalCount){
  if(currentSearchQuery){
    searchInfo.textContent=`Showing ${displayedCount} of ${totalCount} result${totalCount!==1?"s":""} for "${currentSearchQuery}"`
  } else {
    searchInfo.textContent=""
  }
}

function show(title, overview, movieId) {
  overlay.classList.add("show");
  document.getElementById("movie-title").textContent = title;
  
  const container = document.createElement("span");
  const truncated = overview.substring(0, 150) + "... ";
  const textWrapper = document.createElement("span");
  const textNode = document.createTextNode(truncated);
  textWrapper.appendChild(textNode);
  textWrapper.style.transition = "opacity 0.3s";
  container.appendChild(textWrapper);

  if (overview.length > 150) {
    const toggle = document.createElement("span");
    toggle.textContent = "Read more";
    toggle.style.color = "#fff";
    toggle.style.cursor = "pointer";
    toggle.style.borderBottom = "1px solid transparent";
    toggle.style.transition = "border-bottom-color 0.2s";

    toggle.addEventListener("mouseover", () => {
      toggle.style.borderBottomColor = "#fff";
    });
    toggle.addEventListener("mouseout", () => {
      toggle.style.borderBottomColor = "transparent";
    });
    toggle.addEventListener("click", () => {
      const isCollapsed = toggle.textContent === "Read more";
      textWrapper.style.opacity = "0";
      setTimeout(() => {
        textNode.nodeValue = isCollapsed ? overview + " " : truncated;
        toggle.textContent = isCollapsed ? "Show less" : "Read more";
        textWrapper.style.opacity = "1";
      }, 300);
    });

    container.appendChild(toggle);
  }

  document.getElementById("player").src = `https://player.videasy.net/movie/${movieId}?color=8B5CF6`;
  updateRecentlyWatched(movieId);

  // Auto-enter fullscreen after a short delay to let the overlay appear
  setTimeout(() => {
    const videoContainer = document.querySelector(".video-container");
    if (videoContainer) {
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen().catch(err => {
          console.log("Fullscreen request failed:", err);
        });
      } else if (videoContainer.webkitRequestFullscreen) {
        videoContainer.webkitRequestFullscreen();
      } else if (videoContainer.msRequestFullscreen) {
        videoContainer.msRequestFullscreen();
      }
    }
  }, 500);
}

overlay.addEventListener("click", e => {
  if (e.target === overlay) {
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    overlay.classList.remove("show");
    document.getElementById("player").src = "";
    sessionStorage.removeItem('currentMovie');
  }
});

closeBtn.addEventListener("click",()=>{
  // Exit fullscreen if active
  if (document.fullscreenElement) {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
  overlay.classList.remove("show")
  document.getElementById("player").src=""
  sessionStorage.removeItem('currentMovie');
})

// Listen for fullscreen exit (ESC key) and close overlay
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && overlay.classList.contains("show")) {
    overlay.classList.remove("show");
    document.getElementById("player").src = "";
    sessionStorage.removeItem('currentMovie');
  }
});

document.addEventListener("webkitfullscreenchange", () => {
  if (!document.webkitFullscreenElement && overlay.classList.contains("show")) {
    overlay.classList.remove("show");
    document.getElementById("player").src = "";
    sessionStorage.removeItem('currentMovie');
  }
});

// Restore movie when returning to tab
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    const savedMovie = sessionStorage.getItem('currentMovie');
    if (savedMovie) {
      try {
        const movieData = JSON.parse(savedMovie);
        const timeSinceSaved = Date.now() - movieData.timestamp;
        
        // Only restore if less than 5 minutes have passed
        if (timeSinceSaved < 300000 && !overlay.classList.contains("show")) {
          show(movieData.title, movieData.overview, movieData.movieId);
        }
      } catch(e) {}
    }
  }
});

// Also check on page focus
window.addEventListener('focus', function() {
  const savedMovie = sessionStorage.getItem('currentMovie');
  if (savedMovie) {
    try {
      const movieData = JSON.parse(savedMovie);
      const timeSinceSaved = Date.now() - movieData.timestamp;
      
      // Only restore if less than 5 minutes have passed
      if (timeSinceSaved < 300000 && !overlay.classList.contains("show")) {
        show(movieData.title, movieData.overview, movieData.movieId);
      }
    } catch(e) {}
  }
});

function performSearch(resetPage=true){
  const query=searchInput.value.trim()
  currentSearchQuery=query
  if(resetPage){
    currentPage=1
    searchDisplayedCount=0
  }
  if(searchAbortController) searchAbortController.abort()
  searchAbortController=new AbortController()
  if(query===""){
    searchResultsSection.style.display="none"
    otherSections.style.display="block"
  } else {
    searchResultsSection.style.display="block"
    otherSections.style.display="none"
    if(resetPage){
      resultsContainer.innerHTML=""
      noMoviesMessage.style.display="none"
      updateSearchInfo(0,0)
      endMessage.style.display="none"
    }
    fetchMovies(
      `${API_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${currentPage}`,
      resultsContainer,
      false,
      searchAbortController.signal,
      query,
      !resetPage
    )
  }
}

searchInput.addEventListener("input",()=>performSearch(true))
loadMoreBtn.addEventListener("click",()=>{
  if(currentPage<totalPages){
    currentPage++
    performSearch(false)
  }
})

fetchMovies(`${API_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`,popularContainer)
fetchMovies(`${API_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US&page=1`,topRatedContainer)
fetchMovies(`${API_URL}/movie/upcoming?api_key=${API_KEY}&language=en-US&page=1`,upcomingContainer)

function getFavorites(){
  return JSON.parse(localStorage.getItem("favoriteMovies"))||{}
}

function saveFavorites(favorites){
  localStorage.setItem("favoriteMovies",JSON.stringify(favorites))
}

function isFavorite(movieId){
  const favorites=getFavorites()
  return favorites.hasOwnProperty(movieId)
}

function toggleFavorite(movie,iconElement){
  const favorites=getFavorites()
  const isInFavoritesSection=iconElement.closest('#favorites')!==null
  if(isFavorite(movie.id)){
    delete favorites[movie.id]
    iconElement.classList.replace("favorited","fa-heart-broken")
    iconElement.style.animation="heartFallApart 0.6s ease"
    iconElement.addEventListener("animationend",()=>{
      iconElement.classList.replace("fa-heart-broken","fa-heart")
      iconElement.style.animation=""
      if(isInFavoritesSection) loadFavorites()
    },{once:true})
  } else {
    favorites[movie.id]=movie
    iconElement.classList.add("favorited")
    iconElement.style.animation="pop 0.4s ease"
    iconElement.addEventListener("animationend",()=>iconElement.style.animation="",{once:true})
  }
  saveFavorites(favorites)
  if(!isInFavoritesSection) loadFavorites()
}

function loadFavorites(){
  const favorites=getFavorites()
  const movies=Object.values(favorites)
  const favoritesSection=document.getElementById("favorites")
  favoritesSection.style.display=movies.length>0?"block":"none"
  updateContainerWithAnimation(favoritesContainer,()=>displayMovies(movies,favoritesContainer,false))
}

function updateRecentlyWatched(movieId){
  let watched=JSON.parse(localStorage.getItem("recentlyWatched"))||[]
  watched=watched.filter(id=>id!==movieId)
  watched.push(movieId)
  if(watched.length>5) watched.shift()
  localStorage.setItem("recentlyWatched",JSON.stringify(watched))
  updateRecommendations()
}

function updateRecommendations(){
  let watched=JSON.parse(localStorage.getItem("recentlyWatched"))||[]
  const recommendationsSection=document.getElementById("recommendations")
  if(watched.length>0){
    const lastWatchedId=watched[watched.length-1]
    fetchMovies(
      `${API_URL}/movie/${lastWatchedId}/recommendations?api_key=${API_KEY}&language=en-US&page=1`,
      recommendationsContainer,
      false,
      null,
      "",
      false,
      results=>{
        recommendationsSection.style.display=results.length>0?"block":"none"
      }
    )
  } else {
    recommendationsSection.style.display="none"
    recommendationsContainer.innerHTML=""
  }
}

loadFavorites()
updateRecommendations()

// Enhanced redirect and ad blocker
(function() {
  // Store movie state in localStorage for persistence across redirects
  let currentMovieState = null;

  // Block all window.open attempts
  window.open = function() {
    return null;
  };

  // Override window.open for iframes too
  Object.defineProperty(window, 'open', {
    value: function() {
      return null;
    },
    writable: false,
    configurable: false
  });

  // Aggressive location blocking
  let isUserAction = false;
  
  // Block ALL location changes
  const blockLocationChange = () => {
    const currentLocation = window.location.href;
    
    // Store current movie before any potential redirect
    const movieState = localStorage.getItem('currentMovie');
    if (movieState) {
      localStorage.setItem('movieStateBackup', movieState);
    }
    
    // Override location setters
    ['href', 'pathname', 'search', 'hash'].forEach(prop => {
      const descriptor = Object.getOwnPropertyDescriptor(Location.prototype, prop);
      if (descriptor && descriptor.set) {
        Object.defineProperty(Location.prototype, prop, {
          set: function(value) {
            if (!isUserAction) {
              return;
            }
            descriptor.set.call(this, value);
          },
          get: descriptor.get
        });
      }
    });
  };
  
  blockLocationChange();

  const originalReplace = window.location.replace;
  const originalAssign = window.location.assign;
  
  window.location.replace = function(url) {
    if (!isUserAction) {
      return;
    }
    originalReplace.call(window.location, url);
  };
  
  window.location.assign = function(url) {
    if (!isUserAction) {
      return;
    }
    originalAssign.call(window.location, url);
  };

  // Detect page unload attempts
  let pageUnloadAttempted = false;
  window.addEventListener('beforeunload', function(e) {
    if (!isUserAction) {
      pageUnloadAttempted = true;
      e.preventDefault();
      e.stopImmediatePropagation();
      e.returnValue = '';
      
      // Save movie state
      const movieState = sessionStorage.getItem('currentMovie');
      if (movieState) {
        localStorage.setItem('movieStateBackup', movieState);
        localStorage.setItem('movieStateTime', Date.now().toString());
      }
      
      return '';
    }
  }, true);

  window.addEventListener('unload', function(e) {
    if (!isUserAction) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  // Block meta refresh
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'META' && node.httpEquiv === 'refresh') {
            node.remove();
          }
        });
      }
    });
  });
  observer.observe(document.head, { childList: true, subtree: true });

  // Intercept all click events
  document.addEventListener('click', function(e) {
    const target = e.target;
    const link = target.closest('a');
    
    // Allow clicks on our own content
    if (link && link.href && link.href.startsWith(window.location.origin)) {
      isUserAction = true;
      setTimeout(() => { isUserAction = false; }, 1000);
      return;
    }
    
    // Allow clicks on our buttons/elements
    if (target.closest('.close-btn, .load-more, .slider-btn, .movie, #search')) {
      isUserAction = true;
      setTimeout(() => { isUserAction = false; }, 100);
      return;
    }
    
    // Block everything else
    isUserAction = false;
  }, true);

  // Block middle mouse button clicks
  document.addEventListener('auxclick', function(e) {
    if (e.button === 1) {
      const target = e.target.closest('a');
      if (!target || !target.href || !target.href.startsWith(window.location.origin)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    }
  }, true);

  // Block context menu on iframe
  document.addEventListener('contextmenu', function(e) {
    if (e.target.tagName === 'IFRAME') {
      e.preventDefault();
      return false;
    }
  }, true);

  // Intercept fetch/xhr requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && (url.includes('themoviedb.org') || url.includes('image.tmdb.org'))) {
      return originalFetch.apply(this, args);
    }
    if (typeof url === 'string' && (url.includes('redirect') || url.includes('ad') || url.includes('popup'))) {
      return Promise.reject(new Error('Blocked'));
    }
    return originalFetch.apply(this, args);
  };

  // Block timer-based redirects
  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;
  
  window.setTimeout = function(callback, delay, ...args) {
    if (typeof callback === 'string' && (callback.includes('location') || callback.includes('window.open'))) {
      return 0;
    }
    return originalSetTimeout.call(window, callback, delay, ...args);
  };
  
  window.setInterval = function(callback, delay, ...args) {
    if (typeof callback === 'string' && (callback.includes('location') || callback.includes('window.open'))) {
      return 0;
    }
    return originalSetInterval.call(window, callback, delay, ...args);
  };

  // Block focus stealing
  let lastFocusTime = Date.now();
  window.addEventListener('focus', function(e) {
    const timeSinceLast = Date.now() - lastFocusTime;
    if (timeSinceLast < 100 && e.target !== window) {
      e.stopImmediatePropagation();
    }
    lastFocusTime = Date.now();
  }, true);

  // Block visibility change tricks
  document.addEventListener('visibilitychange', function(e) {
    if (!isUserAction && document.hidden) {
      e.stopImmediatePropagation();
    }
  }, true);

  // Monitor and maintain fullscreen state
  let fullscreenAttempts = 0;
  const maxAttempts = 5;
  
  function maintainFullscreen() {
    const videoContainer = document.querySelector(".video-container");
    const overlayVisible = overlay.classList.contains("show");
    
    if (overlayVisible && !document.fullscreenElement && fullscreenAttempts < maxAttempts) {
      fullscreenAttempts++;
      setTimeout(() => {
        if (videoContainer && overlayVisible) {
          if (videoContainer.requestFullscreen) {
            videoContainer.requestFullscreen().catch(() => {});
          } else if (videoContainer.webkitRequestFullscreen) {
            videoContainer.webkitRequestFullscreen();
          } else if (videoContainer.msRequestFullscreen) {
            videoContainer.msRequestFullscreen();
          }
        }
      }, 300);
    }
  }

  // Watch for fullscreen exits
  document.addEventListener('fullscreenchange', function() {
    if (!document.fullscreenElement && overlay.classList.contains("show")) {
      maintainFullscreen();
    } else {
      fullscreenAttempts = 0;
    }
  });

  document.addEventListener('webkitfullscreenchange', function() {
    if (!document.webkitFullscreenElement && overlay.classList.contains("show")) {
      maintainFullscreen();
    } else {
      fullscreenAttempts = 0;
    }
  });

  // Check for saved movie on page load
  window.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      const movieStateBackup = localStorage.getItem('movieStateBackup');
      const movieStateTime = localStorage.getItem('movieStateTime');
      
      if (movieStateBackup && movieStateTime) {
        const timeSince = Date.now() - parseInt(movieStateTime);
        
        // Restore if less than 2 minutes
        if (timeSince < 120000) {
          try {
            const movieData = JSON.parse(movieStateBackup);
            if (movieData && movieData.movieId) {
              setTimeout(() => {
                show(movieData.title, movieData.overview, movieData.movieId);
              }, 500);
            }
          } catch(e) {}
        }
        
        // Clean up
        localStorage.removeItem('movieStateBackup');
        localStorage.removeItem('movieStateTime');
      }
    }, 100);
  });
})();

const initSliders=()=>{
  document.querySelectorAll('.slider-container').forEach(container=>{
    const track=container.querySelector('.slider-track')
    const prev=container.querySelector('.slider-btn.prev')
    const next=container.querySelector('.slider-btn.next')
    let index=0, direction=1, slideWidth=0
    const update=()=>{
      const items=track.children
      const visible=Math.floor(container.offsetWidth/slideWidth)
      const maxIndex=items.length-visible
      index=Math.max(0,Math.min(index,maxIndex))
      track.style.transform=`translateX(${-index*slideWidth}px)`
    }
    const setup=()=>{
      const items=track.children
      if(!items.length) return
      slideWidth=items[0].getBoundingClientRect().width+parseInt(getComputedStyle(track).gap)
      prev.onclick=()=>{ index--; update() }
      next.onclick=()=>{ index++; update() }
      update()
      setInterval(()=>{
        const visible=Math.floor(container.offsetWidth/slideWidth)
        const maxIndex=track.children.length-visible
        if(index>=maxIndex) direction=-1
        if(index<=0) direction=1
        index+=direction
        update()
      },3000)
      observer.disconnect()
    }
    const observer=new MutationObserver(setup)
    observer.observe(track,{childList:true})
    setup()
  })
}

initSliders()
