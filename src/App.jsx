import React, { useState, useRef, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Bell, X, Bookmark, ArrowRight, ArrowLeft, UserCheck, UserPlus, Check } from 'lucide-react';
import HeaderNav from './components/HeaderNav';
import BottomNav from './components/BottomNav';
import VideoCard from './components/VideoCard';
import CommentsDrawer from './components/CommentsDrawer';
import ShareModal from './components/ShareModal';
import UploadModal from './components/UploadModal';
import AudioDetailModal from './components/AudioDetailModal';
import CreatorProfileView from './components/CreatorProfileView';
import EditProfileModal from './components/EditProfileModal';
import EditVideoModal from './components/EditVideoModal';
import AdMobRewardedModal from './components/AdMobRewardedModal';
import DirectMessagesDrawer from './components/DirectMessagesDrawer';
import GiftsDrawer from './components/GiftsDrawer';
import CreatorWalletModal from './components/CreatorWalletModal';
import PromoteVideoModal from './components/PromoteVideoModal';
import AuthModal from './components/AuthModal';
import ProfileView from './components/ProfileView';
import ExploreView from './components/ExploreView';
import InboxView from './components/InboxView';
import StoriesBar from './components/StoriesBar';
import CreateMenuModal from './components/CreateMenuModal';
import MasterPinModal from './components/MasterPinModal';
import PwaInstallBanner from './components/PwaInstallBanner';
import ReportModal from './components/ReportModal';

// 🚀 Módulos pesados en Code-Splitting asíncrono (React.lazy) para acelerar 3x el inicio de Spot Play
const CameraRecorder = lazy(() => import('./components/CameraRecorder'));
const VitrinaView = lazy(() => import('./components/VitrinaView'));
const LiveStreamModal = lazy(() => import('./components/LiveStreamModal'));
const AdminMasterDashboard = lazy(() => import('./components/AdminMasterDashboard'));
import { SEED_CREATORS_MAP } from './data/mockVideos';
import {
  loadPersistedVideos,
  savePersistedVideos,
  loadPersistedUser,
  savePersistedUser,
  savePersistedBookmarks,
  savePersistedLikes,
  loadPersistedReports,
  savePersistedReports,
  loadPersistedBlockedUsers,
  savePersistedBlockedUsers,
} from './utils/storage';
import {
  saveVideoToIndexedDB,
  loadVideosFromIndexedDB,
  deleteVideoFromIndexedDB,
} from './utils/videoDB';
import {
  subscribeVideos,
  toggleFirestoreLike,
  toggleFirestoreBookmark,
  addFirestoreComment,
} from './firebase/videoService';
import { isFirebaseConfigured } from './firebase/config';

// 🎲 Algoritmo de barajado pseudo-aleatorio Fisher-Yates
function shuffleArray(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 🎯 Algoritmo Inteligente de Feed (Estilo TikTok / VitrinaSpot):
// 1. Prioriza los videos nuevos subidos por el usuario para que nunca falte ninguna publicación en el feed.
// 2. Garantiza que NINGÚN video ni autor se repita consecutivamente.
// 3. Distribuye de forma equilibrada los videos subidos y el catálogo oficial.
function generateShuffledFeed(videoList, lastVideoId = null) {
  if (!Array.isArray(videoList) || videoList.length === 0) return [];

  const available = videoList.filter((v) => !v.isHidden);
  if (available.length === 0) return [];

  // Separar los videos subidos por el usuario y los videos oficiales
  const userUploads = available.filter((v) => v.id && v.id.startsWith('uploaded-'));
  const catalogVideos = available.filter((v) => !v.id || !v.id.startsWith('uploaded-'));

  // Ordenar los subidos por fecha más reciente
  userUploads.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  // Barajar el catálogo oficial
  const shuffledCatalog = shuffleArray([...catalogVideos]);

  // Intercalar equilibradamente: cada 1 o 2 videos oficiales, incluir un video del usuario
  const fullSequence = [];
  let userIdx = 0;
  let catIdx = 0;

  // Si hay videos del usuario, el más reciente arranca de primero o segundo
  if (userUploads.length > 0 && Math.random() > 0.4) {
    fullSequence.push(userUploads[userIdx++]);
  }

  while (userIdx < userUploads.length || catIdx < shuffledCatalog.length) {
    // Agregar 1 o 2 del catálogo
    if (catIdx < shuffledCatalog.length) {
      fullSequence.push(shuffledCatalog[catIdx++]);
    }
    if (catIdx < shuffledCatalog.length && userIdx >= userUploads.length) {
      fullSequence.push(shuffledCatalog[catIdx++]);
    }
    // Agregar 1 del usuario
    if (userIdx < userUploads.length) {
      fullSequence.push(userUploads[userIdx++]);
    }
  }

  // Prevención estricta de videos consecutivos iguales:
  const finalResult = [];
  for (let i = 0; i < fullSequence.length; i++) {
    const cur = fullSequence[i];
    const prev = finalResult[finalResult.length - 1];
    if (prev && (prev.id === cur.id || prev.videoUrl === cur.videoUrl)) {
      // Buscar el siguiente elemento que no sea idéntico y cambiarlo
      let swapIdx = -1;
      for (let j = i + 1; j < fullSequence.length; j++) {
        if (fullSequence[j].id !== cur.id && fullSequence[j].videoUrl !== cur.videoUrl) {
          swapIdx = j;
          break;
        }
      }
      if (swapIdx !== -1) {
        [fullSequence[i], fullSequence[swapIdx]] = [fullSequence[swapIdx], fullSequence[i]];
      }
    }
    finalResult.push(fullSequence[i]);
  }

  // Si se provee el último video del ciclo anterior, evitar que el primer video sea idéntico
  if (lastVideoId && finalResult.length > 1 && finalResult[0].id === lastVideoId) {
    const temp = finalResult.shift();
    finalResult.push(temp);
  }

  return finalResult.map((v) => v.id);
}

export default function App() {
  const [videos, setVideos] = useState(loadPersistedVideos);
  // ♾️ Bucle Infinito y Control de Ciclos de Descubrimiento (TikTok Style)
  const cycleCountRef = useRef(1);
  const isExtendingFeedRef = useRef(false);

  // 🎲 Secuencia infinita aleatoria con métricas intercaladas para el Feed Para Ti
  const [feedSequence, setFeedSequence] = useState(() => {
    const initialIds = generateShuffledFeed(loadPersistedVideos());
    return initialIds.map((id, idx) => ({ id, instanceKey: `${id}-c0-${idx}` }));
  });
  const [currentUser, setCurrentUser] = useState(loadPersistedUser);
  const [currentTab, setCurrentTab] = useState('feed'); // 'feed' | 'explore' | 'inbox' | 'profile'
  const [feedFilter, setFeedFilter] = useState('foryou'); // 'foryou' | 'following'
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [bookmarkToast, setBookmarkToast] = useState(null); // { message, isBookmarked, videoId }
  const [orderToast, setOrderToast] = useState(null); // { message, orderId }
  const [followToast, setFollowToast] = useState(null); // { message, isFollowing }
  const [editingVideo, setEditingVideo] = useState(null);
  const [profileInitialTab, setProfileInitialTab] = useState('videos');
  const bookmarkToastTimeoutRef = useRef(null);

  // Modals & Sub-views State
  const [activeCommentVideo, setActiveCommentVideo] = useState(null);
  const [activeShareVideo, setActiveShareVideo] = useState(null);
  const [activeReportVideo, setActiveReportVideo] = useState(null);
  const [reports, setReports] = useState(loadPersistedReports);
  const [blockedUsers, setBlockedUsers] = useState(loadPersistedBlockedUsers);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeAudioDetail, setActiveAudioDetail] = useState(null);
  const [activeCreatorProfile, setActiveCreatorProfile] = useState(null);
  const [returnToCreatorProfile, setReturnToCreatorProfile] = useState(null);
  const [activeChatPartner, setActiveChatPartner] = useState(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);

  // 💰 Monetization Modals State
  const [activeGiftsCreator, setActiveGiftsCreator] = useState(null);
  const [activePromoteVideo, setActivePromoteVideo] = useState(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [screenGiftAnimation, setScreenGiftAnimation] = useState(null);
  const [isStoriesOpen, setIsStoriesOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isLiveStudioOpen, setIsLiveStudioOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdMobRewardedOpen, setIsAdMobRewardedOpen] = useState(false);
  // 🔐 Seguridad Maestro (Solo Dueño)
  const [isMasterAdminAuthenticated, setIsMasterAdminAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('spotplay_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [isMasterPinModalOpen, setIsMasterPinModalOpen] = useState(false);

  const handleRequestMasterAccess = () => {
    if (isMasterAdminAuthenticated) {
      setIsAdminOpen(true);
    } else {
      setIsMasterPinModalOpen(true);
    }
  };

  const handleMasterPinSuccess = () => {
    setIsMasterAdminAuthenticated(true);
    try {
      sessionStorage.setItem('spotplay_admin_auth', 'true');
    } catch {}
    setIsMasterPinModalOpen(false);
    setIsAdminOpen(true);
  };

  const handleLockMasterAdmin = () => {
    setIsMasterAdminAuthenticated(false);
    try {
      sessionStorage.removeItem('spotplay_admin_auth');
    } catch {}
    setIsAdminOpen(false);
  };

  // 🛡️ Detección de ruta secreta /admin y puente intercomunicador desde VitrinaSpot
  useEffect(() => {
    if (window.location.hash.includes('admin') || window.location.search.includes('admin')) {
      handleRequestMasterAccess();
    }
    const handleAdminBridgeMsg = (e) => {
      if (e.data && (e.data.type === 'SPOTPLAY_OPEN_ADMIN' || e.data.type === 'OPEN_SPOTPLAY_ADMIN')) {
        handleRequestMasterAccess();
      }
    };
    window.addEventListener('message', handleAdminBridgeMsg);
    window.addEventListener('hashchange', () => {
      if (window.location.hash.includes('admin')) handleRequestMasterAccess();
    });
    return () => window.removeEventListener('message', handleAdminBridgeMsg);
  }, [isMasterAdminAuthenticated]);

  const [activeBroadcastBanner, setActiveBroadcastBanner] = useState(null);
  const [isFullWindowMode, setIsFullWindowMode] = useState(false);

  // 🔋 Page Visibility API: pausa automática al bloquear pantalla o minimizar la app
  const [isWindowVisible, setIsWindowVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsWindowVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Unique creators for live stories bar
  const uniqueCreators = Array.from(
    new Map(videos.map((v) => [v.author?.id, v.author])).values()
  ).filter(Boolean);

  // Upload modal pre-fill state
  const [uploadPreFill, setUploadPreFill] = useState({ videoUrl: null, videoBlob: null, sound: null });

  const containerRef = useRef(null);
  const videoRefs = useRef([]);

  // Cargar videos persistidos en servidor compartido e IndexedDB al abrir la app
  useEffect(() => {
    async function initSharedSync() {
      try {
        // 1. Sincronizar videos desde el servidor compartido (compartidos entre PC y Celular)
        const res = await fetch('/api/videos');
        if (res.ok) {
          const rawServerVideos = await res.json();
          if (Array.isArray(rawServerVideos) && rawServerVideos.length > 0) {
            const serverVideos = rawServerVideos.map((v) => {
              const seedCreator = SEED_CREATORS_MAP[v.id];
              if (
                seedCreator &&
                (v.author?.id === 'me' ||
                  v.author?.username === 'nuevo_creador' ||
                  v.author?.name === 'Mi Perfil Creador')
              ) {
                return { ...v, author: seedCreator };
              }
              return v;
            });
            setVideos((prev) => {
              const serverIds = new Set(serverVideos.map((v) => v.id));
              const prevFiltered = prev.filter((v) => !serverIds.has(v.id));
              const combined = [...serverVideos, ...prevFiltered];
              // Sanitizar totalmente cualquier residuo de tiendas, productos o pautas comerciales
              const sanitized = combined.map(({ product, isPromoted, promotedCta, promotedCity, ...v }) => v);
              // 🎲 Aplicar métricas de visualización intercaladas con el catálogo completo del servidor
              const freshIds = generateShuffledFeed(sanitized);
              setFeedSequence(freshIds.map((id, idx) => ({ id, instanceKey: `${id}-c0-${idx}` })));
              return sanitized;
            });
          }
        }

        // 2. Sincronizar perfil del creador desde el servidor compartido
        const userRes = await fetch('/api/users');
        if (userRes.ok) {
          const serverUsers = await userRes.json();
          if (Array.isArray(serverUsers) && serverUsers.length > 0) {
            // Fijar de forma prioritaria el perfil oficial de Leonardo (Dueño)
            const ownerUser = serverUsers.find(
              (u) => u.email === 'leonardoescarlata6@gmail.com' || u.id === 'user-1794726360816' || u.username === 'leonardo'
            );
            const activeUser = ownerUser || serverUsers[0];
            if (activeUser && activeUser.id) {
              setCurrentUser((prev) => {
                const activeHasRealAvatar = activeUser.avatar && activeUser.avatar.startsWith('data:image');
                const prevHasRealAvatar = prev?.avatar && prev.avatar.startsWith('data:image');
                
                if (activeHasRealAvatar && !prevHasRealAvatar) {
                  return { ...prev, ...activeUser, avatar: activeUser.avatar };
                }
                if (!prev || prev.id === 'guest' || prev.id === 'me' || prev.username === 'nuevo_creador') {
                  return activeUser;
                }
                return prev;
              });
            }
          }
        }

        // 3. Restaurar creadores seguidos persistidos en el almacenamiento local
        try {
          const rawFollowed = localStorage.getItem('spotplay_followed_creator_ids_v1');
          if (rawFollowed) {
            const followedSet = new Set(JSON.parse(rawFollowed));
            if (followedSet.size > 0) {
              setVideos((prev) =>
                prev.map((v) => {
                  if (v.author && (followedSet.has(v.author.id) || followedSet.has(v.author.username))) {
                    return {
                      ...v,
                      author: {
                        ...v.author,
                        isFollowing: true,
                      },
                    };
                  }
                  return v;
                })
              );
            }
          }
        } catch {}
      } catch (err) {
        console.warn('Sync server en modo local');
      }

      try {
        const storedVideos = await loadVideosFromIndexedDB();
        if (storedVideos && storedVideos.length > 0) {
          setVideos((prev) => {
            const storedIds = new Set(storedVideos.map((v) => v.id));
            const existingWithoutDupes = prev.filter((v) => !storedIds.has(v.id));
            return [...storedVideos, ...existingWithoutDupes];
          });
        }
      } catch (err) {
        console.warn('Error leyendo videos guardados de IndexedDB:', err);
      }
    }
    initSharedSync();
  }, []);

  // Persist videos whenever state updates
  useEffect(() => {
    savePersistedVideos(videos);
  }, [videos]);

  // Persist user whenever profile updates
  useEffect(() => {
    savePersistedUser(currentUser);
  }, [currentUser]);


  // Real-time Firestore sync
  useEffect(() => {
    const unsubscribe = subscribeVideos((latestVideos) => {
      if (latestVideos && latestVideos.length > 0) {
        setVideos(latestVideos);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // 📱 Despeje global de teclado virtual para que nunca tape los recuadros de escritura
  useEffect(() => {
    const handleFocusIn = (e) => {
      const target = e.target;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        // En móviles, esperar 250ms a que el teclado termine de desplegarse
        setTimeout(() => {
          try {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch (err) {}
        }, 260);
      }
    };

    window.addEventListener('focusin', handleFocusIn);
    return () => window.removeEventListener('focusin', handleFocusIn);
  }, []);

  // 🎬 Feed Dinámico e Inteligente: Bucle Infinito y Métricas Intercaladas (TikTok Style)
  const displayedVideos = useMemo(() => {
    const videoMap = new Map(videos.map((v) => [v.id, v]));

    // 1. Filtrar videos visibles según moderación, bloqueos y pestaña
    const visibleVideos = videos.filter((video) => {
      if (video.isHidden) return false;
      const authorId = video.author?.id;
      const authorUsername = video.author?.username;
      if (authorId && blockedUsers.includes(authorId)) return false;
      if (authorUsername && blockedUsers.includes(authorUsername)) return false;
      if (feedFilter === 'following') {
        return Boolean(video.author?.isFollowing);
      }
      return true;
    });

    if (feedFilter === 'following') {
      return visibleVideos;
    }

    // 2. Mapear en la secuencia infinita con claves únicas de instancia
    const ordered = [];
    const addedIds = new Set();

    feedSequence.forEach((item) => {
      const vid = videoMap.get(item.id);
      if (vid && !vid.isHidden) {
        const authorId = vid.author?.id;
        const authorUsername = vid.author?.username;
        if (!(authorId && blockedUsers.includes(authorId)) && !(authorUsername && blockedUsers.includes(authorUsername))) {
          ordered.push({ ...vid, feedInstanceId: item.instanceKey });
          addedIds.add(vid.id);
        }
      }
    });

    // 3. Si hay videos que no estaban en la secuencia inicial, agregarlos al final
    visibleVideos.forEach((vid) => {
      if (!addedIds.has(vid.id)) {
        ordered.push({ ...vid, feedInstanceId: `${vid.id}-c0-fallback` });
        addedIds.add(vid.id);
      }
    });

    return ordered.length > 0 ? ordered : visibleVideos;
  }, [videos, feedSequence, feedFilter, blockedUsers]);

  // ♾️ Extender feed automáticamente con un nuevo ciclo aleatorio e intercalado
  const handleExtendFeed = useCallback(() => {
    if (isExtendingFeedRef.current || feedFilter !== 'foryou') return;
    isExtendingFeedRef.current = true;
    const nextCycle = cycleCountRef.current++;
    const nextBatchIds = generateShuffledFeed(videos);
    if (nextBatchIds.length > 0) {
      setFeedSequence((prev) => [
        ...prev,
        ...nextBatchIds.map((id, idx) => ({ id, instanceKey: `${id}-c${nextCycle}-${idx}` })),
      ]);
    }
    setTimeout(() => {
      isExtendingFeedRef.current = false;
    }, 800);
  }, [videos, feedFilter]);

  // Disparar extensión cuando el usuario se acerca al final del feed
  useEffect(() => {
    if (currentTab !== 'feed' || feedFilter !== 'foryou') return;
    if (displayedVideos.length === 0) return;
    if (activeVideoIndex >= displayedVideos.length - 3) {
      handleExtendFeed();
    }
  }, [activeVideoIndex, displayedVideos.length, currentTab, feedFilter, handleExtendFeed]);

  // Re-barajar el feed para iniciar una nueva experiencia aleatoria
  const handleShuffleFeed = () => {
    cycleCountRef.current = 1;
    isExtendingFeedRef.current = false;
    const freshIds = generateShuffledFeed(videos);
    setFeedSequence(freshIds.map((id, idx) => ({ id, instanceKey: `${id}-c0-${idx}` })));
    setActiveVideoIndex(0);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Observe active video for autoplay / pause (Calibración ultra suave a 50% de visibilidad)
  useEffect(() => {
    if (currentTab !== 'feed') return;

    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let candidateIndex = -1;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              maxRatio = entry.intersectionRatio;
              candidateIndex = index;
            }
          }
        });
        if (candidateIndex !== -1 && maxRatio >= 0.6) {
          setActiveVideoIndex((prev) => (prev !== candidateIndex ? candidateIndex : prev));
        }
      },
      {
        threshold: [0.6, 0.75],
      }
    );

    const elements = videoRefs.current.filter(Boolean);
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [displayedVideos, currentTab]);

  // 🌟 Motor de Desvanecimiento Dinámico en Scroll estilo VitrinaSpot (60/120 FPS sin re-render de React)
  useEffect(() => {
    if (currentTab !== 'feed') return;
    const container = containerRef.current;
    if (!container) return;

    let rafId = null;
    let scrollTimeout = null;

    const updateScrollFade = () => {
      const containerRect = container.getBoundingClientRect();
      if (containerRect.height <= 0) return;

      const containerCenter = containerRect.top + containerRect.height / 2;
      // Umbral: a partir del 35% de desviación del centro, la UI se desvanece por completo
      const maxDistance = containerRect.height * 0.35;

      // Optimización 120 FPS: Solo calcular fade en tarjetas cercanas a la pantalla activa
      const startIdx = Math.max(0, activeVideoIndex - 2);
      const endIdx = Math.min(videoRefs.current.length - 1, activeVideoIndex + 2);

      for (let i = startIdx; i <= endIdx; i++) {
        const card = videoRefs.current[i];
        if (!card) continue;
        const sideActions = card.querySelector('.video-side-actions');
        const bottomInfo = card.querySelector('.video-bottom-info');
        if (!sideActions && !bottomInfo) continue;

        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.top + cardRect.height / 2;
        const diff = Math.abs(cardCenter - containerCenter);

        // Curva suave cuadrática/orgánica estilo VitrinaSpot
        const rawProgress = Math.max(0, 1 - (diff / maxDistance));
        const progress = Math.pow(rawProgress, 1.4);

        const opacityVal = progress.toFixed(3);
        const scaleVal = (0.94 + 0.06 * progress).toFixed(3);
        const pointerVal = progress > 0.35 ? 'auto' : 'none';

        if (sideActions) {
          sideActions.style.opacity = opacityVal;
          sideActions.style.transform = `scale(${scaleVal})`;
          sideActions.style.pointerEvents = pointerVal;
        }

        if (bottomInfo) {
          bottomInfo.style.opacity = opacityVal;
          bottomInfo.style.transform = `scale(${scaleVal})`;
          bottomInfo.style.pointerEvents = pointerVal;
        }
      }
    };

    const onScroll = () => {
      if (container.scrollHeight - (container.scrollTop + container.clientHeight) < 1200) {
        handleExtendFeed();
      }
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          updateScrollFade();
          rafId = null;
        });
      }
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateScrollFade, 90);
    };

    const onScrollEnd = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (scrollTimeout) clearTimeout(scrollTimeout);
      updateScrollFade();

      // Sincronización milimétrica del video activo al terminar de deslizar
      if (container.clientHeight > 0) {
        const snapIndex = Math.round(container.scrollTop / container.clientHeight);
        if (snapIndex >= 0 && snapIndex < displayedVideos.length) {
          setActiveVideoIndex((prev) => (prev !== snapIndex ? snapIndex : prev));
        }
      }
    };

    const onResize = () => {
      updateScrollFade();
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    container.addEventListener('scrollend', onScrollEnd, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    // Calibración inicial tras montar o cambiar a la pestaña 'feed'
    const initTimer = setTimeout(updateScrollFade, 60);

    return () => {
      clearTimeout(initTimer);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (rafId) cancelAnimationFrame(rafId);
      container.removeEventListener('scroll', onScroll);
      container.removeEventListener('scrollend', onScrollEnd);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [displayedVideos, currentTab, handleExtendFeed]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIdx = Math.min(activeVideoIndex + 1, displayedVideos.length - 1);
        videoRefs.current[nextIdx]?.scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIdx = Math.max(activeVideoIndex - 1, 0);
        videoRefs.current[prevIdx]?.scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        const curVideo = displayedVideos[activeVideoIndex];
        if (curVideo) handleToggleLike(curVideo.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideoIndex, displayedVideos]);

  // Handle Like Toggle (con persistencia aislada, protección contra NaN y sincronización)
  const handleToggleLike = async (videoId) => {
    let nextLikedState = false;
    setVideos((prev) => {
      const updated = prev.map((v) => {
        if (v.id === videoId) {
          nextLikedState = !v.isLiked;
          const currentLikes = typeof v.stats?.likes === 'number' ? v.stats.likes : 0;
          return {
            ...v,
            isLiked: nextLikedState,
            stats: {
              ...v.stats,
              likes: nextLikedState ? currentLikes + 1 : Math.max(0, currentLikes - 1),
            },
          };
        }
        return v;
      });

      // Persistir la lista de IDs de videos con Me gusta en LocalStorage
      const savedLikedIds = updated.filter((v) => v.isLiked).map((v) => v.id);
      savePersistedLikes(savedLikedIds);

      return updated;
    });

    await toggleFirestoreLike(videoId, nextLikedState);
  };

  // Handle Bookmark Toggle (Guardar en Favoritos con persistencia y feedback)
  const handleToggleBookmark = async (videoId) => {
    let nextState = false;
    setVideos((prev) => {
      const updated = prev.map((v) => {
        if (v.id === videoId) {
          nextState = !v.isBookmarked;
          const currentBookmarks = typeof v.stats?.bookmarks === 'number' ? v.stats.bookmarks : 0;
          return {
            ...v,
            isBookmarked: nextState,
            stats: {
              ...v.stats,
              bookmarks: nextState ? currentBookmarks + 1 : Math.max(0, currentBookmarks - 1),
            },
          };
        }
        return v;
      });

      // Persistir la lista de IDs de videos guardados en Favoritos
      const savedIds = updated.filter((v) => v.isBookmarked).map((v) => v.id);
      savePersistedBookmarks(savedIds);

      return updated;
    });

    // Retroalimentación visual inmediata con Toast Flotante interactivo (Estilo TikTok)
    setBookmarkToast({
      message: nextState ? 'Guardado en tus Favoritos' : 'Eliminado de tus Favoritos',
      isBookmarked: nextState,
      videoId,
    });

    if (bookmarkToastTimeoutRef.current) {
      clearTimeout(bookmarkToastTimeoutRef.current);
    }
    bookmarkToastTimeoutRef.current = setTimeout(() => {
      setBookmarkToast(null);
    }, 3200);

    await toggleFirestoreBookmark(videoId, nextState);
  };

  // Handle Feed Tab Switch ('foryou' | 'following') with smooth reset & shuffle
  const handleSelectFeedTab = (tab) => {
    if (tab === 'foryou' && feedFilter === 'foryou') {
      // Si ya está en 'Para ti' y vuelve a tocarlo, re-barajar aleatoriamente el feed
      handleShuffleFeed();
      return;
    }
    setFeedFilter(tab);
    setActiveVideoIndex(0);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 👥 Detección Inteligente: Redirigir a tu propio perfil o al de otro creador
  const handleOpenCreatorOrMyProfile = (author) => {
    if (!author) return;
    const isOwn = Boolean(
      author.id === 'me' ||
      author.id === currentUser.id ||
      (currentUser.username && author.username === currentUser.username)
    );
    if (isOwn) {
      setActiveCreatorProfile(null);
      setCurrentTab('profile');
    } else {
      setActiveCreatorProfile(author);
    }
  };

  // ✏️ Funciones Oficiales de Edición y Eliminación de Videos
  const handleOpenEditVideo = (videoToEdit) => {
    setEditingVideo(videoToEdit);
  };

  const handleSaveEditVideo = (updatedVideo) => {
    setVideos((prev) => {
      const updated = prev.map((v) => (v.id === updatedVideo.id ? updatedVideo : v));
      savePersistedVideos(updated);
      return updated;
    });

    // Sincronizar actualización con IndexedDB y el servidor central
    saveVideoToIndexedDB(updatedVideo).catch(() => {});
    fetch('/api/videos/' + updatedVideo.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedVideo),
    }).catch(() => {});

    setEditingVideo(null);
    setOrderToast({ message: '✅ Video actualizado exitosamente' });
    setTimeout(() => setOrderToast(null), 3000);
  };

  const handleDeleteVideo = (videoId) => {
    // 🗑️ Eliminar permanentemente del servidor central y de IndexedDB
    fetch('/api/videos/' + videoId, { method: 'DELETE' }).catch(() => {});
    deleteVideoFromIndexedDB(videoId).catch(() => {});

    setVideos((prev) => {
      const updated = prev.filter((v) => v.id !== videoId);
      savePersistedVideos(updated);
      return updated;
    });
    setEditingVideo(null);
    setOrderToast({ message: '🗑️ Video eliminado de tu perfil' });
    setTimeout(() => setOrderToast(null), 3000);
  };

  // 👤 Handle Follow Toggle Profesional (Sincronizado, Persistido con Toast estilo TikTok)
  const handleToggleFollow = (authorId, authorUsername) => {
    if (!authorId || authorId === 'me' || authorId === currentUser.id || authorUsername === currentUser.username) {
      return;
    }

    const targetVideo = videos.find((v) => v.author?.id === authorId || (authorUsername && v.author?.username === authorUsername));
    const currentlyFollowing = targetVideo
      ? Boolean(targetVideo.author?.isFollowing)
      : Boolean(activeCreatorProfile && (activeCreatorProfile.id === authorId || activeCreatorProfile.username === authorUsername) && activeCreatorProfile.isFollowing);
    const nextFollowingState = !currentlyFollowing;
    const targetHandle = authorUsername || targetVideo?.author?.username || activeCreatorProfile?.username || 'creador';

    // 1. Actualizar videos en memoria y almacenamiento
    setVideos((prev) => {
      const updated = prev.map((v) => {
        if (v.author?.id === authorId || (authorUsername && v.author?.username === authorUsername)) {
          return {
            ...v,
            author: {
              ...v.author,
              isFollowing: nextFollowingState,
            },
          };
        }
        return v;
      });
      savePersistedVideos(updated);
      return updated;
    });

    // 2. Persistir lista de IDs/handles seguidos
    try {
      const rawFollowed = localStorage.getItem('spotplay_followed_creator_ids_v1');
      const followedSet = new Set(rawFollowed ? JSON.parse(rawFollowed) : []);
      if (nextFollowingState) {
        followedSet.add(authorId);
        if (authorUsername) followedSet.add(authorUsername);
      } else {
        followedSet.delete(authorId);
        if (authorUsername) followedSet.delete(authorUsername);
      }
      localStorage.setItem('spotplay_followed_creator_ids_v1', JSON.stringify(Array.from(followedSet)));
    } catch {}

    // 3. Actualizar perfil de creador si está abierto
    if (activeCreatorProfile && (activeCreatorProfile.id === authorId || activeCreatorProfile.username === authorUsername)) {
      setActiveCreatorProfile((prev) => ({
        ...prev,
        isFollowing: nextFollowingState,
      }));
    }

    // 4. Actualizar contador del usuario autenticado
    setCurrentUser((prev) => {
      const baseCount = typeof prev.followingCount === 'number' ? prev.followingCount : 0;
      const updatedCount = nextFollowingState ? baseCount + 1 : Math.max(0, baseCount - 1);
      const updated = {
        ...prev,
        followingCount: updatedCount,
      };
      savePersistedUser(updated);
      return updated;
    });

    // 5. Toast flotante profesional estilo TikTok
    setFollowToast({
      message: nextFollowingState ? `Siguiendo a @${targetHandle}` : `Dejaste de seguir a @${targetHandle}`,
      isFollowing: nextFollowingState,
    });
    setTimeout(() => {
      setFollowToast(null);
    }, 2200);
  };

  // 🚀 Incrementar métrica viral de compartidos en tiempo real
  const handleShareSuccess = (videoId) => {
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          return {
            ...v,
            stats: {
              ...v.stats,
              shares: (v.stats?.shares || 0) + 1,
            },
          };
        }
        return v;
      })
    );
  };

  // 🛡️ Moderación de la Comunidad: Denunciar y Ocultar Videos (Normas Google Play & AdMob)
  const handleOpenReport = (video) => {
    setActiveReportVideo(video);
  };

  const handleSubmitReport = (reportData) => {
    setReports((prev) => {
      const updated = [reportData, ...prev];
      savePersistedReports(updated);
      return updated;
    });

    if (reportData.hideVideo) {
      setVideos((prev) => {
        const updated = prev.map((v) => (v.id === reportData.videoId ? { ...v, isHidden: true } : v));
        savePersistedVideos(updated);
        return updated;
      });
    }

    if (reportData.blockCreator && (reportData.creatorId || reportData.creatorUsername)) {
      setBlockedUsers((prev) => {
        const updated = [...new Set([...prev, reportData.creatorId, reportData.creatorUsername].filter(Boolean))];
        savePersistedBlockedUsers(updated);
        return updated;
      });
    }

    setBookmarkToast({
      message: '🛡️ Denuncia registrada. Video ocultado de tu feed.',
      isBookmarked: false,
    });
    setTimeout(() => setBookmarkToast(null), 3000);
  };

  const handleHideVideo = (videoId) => {
    setVideos((prev) => {
      const updated = prev.map((v) => (v.id === videoId ? { ...v, isHidden: true } : v));
      savePersistedVideos(updated);
      return updated;
    });
    setBookmarkToast({
      message: '👁️ Ocultado. No volveremos a mostrarte esta publicación.',
      isBookmarked: false,
    });
    setTimeout(() => setBookmarkToast(null), 2500);
  };

  // Handle Add Comment (soporta comentarios raíz y respuestas anidadas)
  const handleAddComment = async (videoId, text, replyToCommentId = null) => {
    const isVideoAuthor = activeCommentVideo?.author?.username === currentUser.username;
    const newCommentItem = {
      id: (replyToCommentId ? 'r-' : 'c-') + Date.now(),
      username: currentUser.username,
      avatar: currentUser.avatar,
      text,
      timestamp: 'Ahora',
      likes: 0,
      isLiked: false,
      isAuthor: isVideoAuthor,
      replies: [],
    };

    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          let updatedComments = [];
          if (replyToCommentId) {
            // Es una respuesta anidada a un comentario existente
            updatedComments = (v.comments || []).map((c) => {
              if (c.id === replyToCommentId) {
                return {
                  ...c,
                  replies: [...(c.replies || []), newCommentItem],
                };
              }
              return c;
            });
          } else {
            // Comentario principal nuevo
            updatedComments = [newCommentItem, ...(v.comments || [])];
          }

          const updatedVideo = {
            ...v,
            comments: updatedComments,
            stats: {
              ...v.stats,
              comments: (v.stats?.comments || 0) + 1,
            },
          };
          if (activeCommentVideo && activeCommentVideo.id === videoId) {
            setActiveCommentVideo(updatedVideo);
          }
          return updatedVideo;
        }
        return v;
      })
    );

    await addFirestoreComment(videoId, newCommentItem);
  };

  // Handle Comment Like Toggle (soporta likes tanto en comentarios raíz como en respuestas anidadas)
  const handleToggleCommentLike = (videoId, commentId, parentCommentId = null) => {
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          const updatedComments = (v.comments || []).map((c) => {
            if (parentCommentId && c.id === parentCommentId) {
              const updatedReplies = (c.replies || []).map((r) => {
                if (r.id === commentId) {
                  const isLiked = !r.isLiked;
                  return {
                    ...r,
                    isLiked,
                    likes: isLiked ? r.likes + 1 : Math.max(0, r.likes - 1),
                  };
                }
                return r;
              });
              return { ...c, replies: updatedReplies };
            }

            if (c.id === commentId) {
              const isLiked = !c.isLiked;
              return {
                ...c,
                isLiked,
                likes: isLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
              };
            }
            return c;
          });

          const updatedVideo = { ...v, comments: updatedComments };
          if (activeCommentVideo && activeCommentVideo.id === videoId) {
            setActiveCommentVideo(updatedVideo);
          }
          return updatedVideo;
        }
        return v;
      })
    );
  };

  // Handle Camera finish
  const handleFinishRecording = ({ videoUrl, videoBlob, sound }) => {
    setUploadPreFill({ videoUrl, videoBlob, sound });
    setIsUploadOpen(true);
  };

  // Use Sound from Audio Detail
  const handleUseSound = (sound) => {
    setActiveAudioDetail(null);
    setUploadPreFill({ videoUrl: null, videoBlob: null, sound });
    setIsUploadOpen(true);
  };

  // Handle Upload Success
  const handleUploadSuccess = async (newVideo, targetBlob) => {
    const fullVideo = {
      ...newVideo,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
        isVerified: true,
      },
      createdAt: Date.now(),
    };

    // Guardar permanentemente en almacenamiento IndexedDB
    if (targetBlob) {
      await saveVideoToIndexedDB(fullVideo, targetBlob);
    }

    setVideos((prev) => {
      const updated = [fullVideo, ...prev.filter((v) => v.id !== fullVideo.id)];
      savePersistedVideos(updated);
      return updated;
    });
    setFeedSequence((prev) => [
      { id: fullVideo.id, instanceKey: `${fullVideo.id}-new-${Date.now()}` },
      ...prev.filter((item) => item.id !== fullVideo.id),
    ]);
    setUploadPreFill({ videoUrl: null, videoBlob: null, sound: null });
    setCurrentTab('feed');
    setFeedFilter('foryou');
    setActiveVideoIndex(0);
    // El sonido del feed se activará cuando el creador decida volver al feed con la flecha
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Select video (desde perfil de creador, favoritos, sonidos o búsqueda)
  const handleSelectVideo = (videoId, fromCreator = null) => {
    // 1. Cerrar cualquier overlay o perfil abierto para mostrar el video limpio
    setActiveCreatorProfile(null);
    setActiveChatPartner(null);
    setActiveAudioDetail(null);
    setIsStoriesOpen(false);
    setFeedFilter('foryou');
    setCurrentTab('feed');
    setIsMuted(false); // 🔊 Desmutear para que se escuche el video seleccionado
    setReturnToCreatorProfile(fromCreator || null);

    // 2. Colocar el video seleccionado al inicio del feed para garantizar reproducción inmediata
    setFeedSequence((prev) => {
      const filtered = prev.filter((item) => item.id !== videoId);
      return [{ id: videoId, instanceKey: `${videoId}-sel-${Date.now()}` }, ...filtered];
    });

    setActiveVideoIndex(0);

    // 3. Desplazar inmediatamente el contenedor del feed a la cima (posición 0)
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
      });
    }
  };

  // 🎯 Restaurar automáticamente el video exacto donde estaba el usuario al regresar al feed
  useEffect(() => {
    if (currentTab === 'feed' && containerRef.current) {
      const targetElement = videoRefs.current[activeVideoIndex];
      if (targetElement) {
        requestAnimationFrame(() => {
          targetElement.scrollIntoView({ behavior: 'auto' });
        });
      }
    }
  }, [currentTab]);


  // 👑 Manejadores del Panel Maestro de Administrador (SpotPlay)
  const handleToggleVerification = (creatorId) => {
    if (!creatorId) return;
    if (currentUser.id === creatorId || currentUser.username === creatorId) {
      setCurrentUser((u) => ({ ...u, isVerified: !u.isVerified }));
    }
    setVideos((prev) =>
      prev.map((v) => {
        if (v.author?.id === creatorId || v.author?.username === creatorId) {
          return {
            ...v,
            author: {
              ...v.author,
              isVerified: !v.author?.isVerified,
            },
          };
        }
        return v;
      })
    );
  };

  const handleTogglePinVideo = (videoId) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, isPinned: !v.isPinned } : v))
    );
  };

  const handleToggleHideVideo = (videoId) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, isHidden: !v.isHidden } : v))
    );
  };

  const handleBroadcastNotification = ({ title, message, target }) => {
    setActiveBroadcastBanner({
      title,
      message,
      target,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    });
    setTimeout(() => {
      setActiveBroadcastBanner(null);
    }, 8000);
  };

  // 🎁 Handle Send Virtual Gift (Monetización en Video & Acreditación de SpotCoins de Seguidores)
  const handleSendGift = ({ gift, creator }) => {
    const currentVid = displayedVideos[activeVideoIndex];
    const isMyVideo =
      creator.id === currentUser.id ||
      creator.username === currentUser.username ||
      currentVid?.author?.id === currentUser.id ||
      currentVid?.author?.username === currentUser.username ||
      currentUser.id === 'me' ||
      currentUser.username === 'nuevo_creador' ||
      creator.username === 'sofia_creative';

    // 1. Deducir monedas gastadas del usuario y si es para mi video, acreditar SpotCoins recibidas
    setCurrentUser((prev) => {
      const remainingCoins = Math.max(0, (prev.wallet?.coins || 0) - gift.coins);
      const currentTransactions = prev.wallet?.transactions || [];
      const currentReceivedGifts = prev.receivedGifts || [];

      if (isMyVideo) {
        const newGiftRecord = {
          id: `rg-${Date.now()}`,
          giftId: gift.id,
          giftName: gift.name,
          emoji: gift.emoji,
          coins: gift.coins,
          senderName: prev.name,
          senderUsername: prev.username,
          senderAvatar: prev.avatar,
          videoTitle: currentVid ? (currentVid.description?.slice(0, 32) || 'Tu video') : 'Tu video',
          videoId: currentVid?.id,
          date: 'Hace un momento',
        };

        const newTx = {
          id: `tx-gift-${Date.now()}`,
          type: 'VIDEO_GIFT',
          title: `Regalo en Video: ${gift.emoji} ${gift.name}`,
          subtitle: `En tu video • @${prev.username}`,
          coins: gift.coins,
          status: 'COMPLETED',
          date: 'Hoy',
          icon: 'gift',
        };

        return {
          ...prev,
          wallet: {
            ...prev.wallet,
            coins: remainingCoins,
            totalGiftsReceivedCoins: (prev.wallet?.totalGiftsReceivedCoins || 0) + gift.coins,
            transactions: [newTx, ...currentTransactions],
          },
          receivedGifts: [newGiftRecord, ...currentReceivedGifts],
        };
      }

      return {
        ...prev,
        wallet: {
          ...prev.wallet,
          coins: remainingCoins,
        },
      };
    });

    // 2. Trigger visual celebration animation on screen
    setScreenGiftAnimation({
      emoji: gift.emoji,
      name: gift.name,
      creatorName: creator.username,
    });
    setTimeout(() => {
      setScreenGiftAnimation(null);
    }, 2500);

    // 3. Update target video stats & set active gifted state
    if (currentVid) {
      setVideos((prev) =>
        prev.map((v) =>
          v.id === currentVid.id
            ? {
                ...v,
                hasUserGifted: true,
                stats: {
                  ...v.stats,
                  giftsCount: (v.stats?.giftsCount || 0) + 1,
                },
              }
            : v
        )
      );
    }
  };

  // 🪙 Handle Recharge Coins (Con persistencia)
  const handleRechargeCoins = (coinsAdded) => {
    setCurrentUser((prev) => {
      const updated = {
        ...prev,
        wallet: {
          ...prev.wallet,
          coins: (prev.wallet?.coins || 0) + coinsAdded,
        },
      };
      savePersistedUser(updated);
      return updated;
    });
  };

  // 💸 Handle Creator Wallet Withdrawal
  const handleWithdrawSuccess = (withdrawData) => {
    const amountNum = typeof withdrawData === 'object' ? Number(withdrawData.amount) : Number(withdrawData);
    const method = typeof withdrawData === 'object' ? (withdrawData.method || 'nequi') : 'nequi';
    const accountNumber = typeof withdrawData === 'object' ? (withdrawData.accountNumber || '') : '';

    setCurrentUser((prev) => {
      const currentTransactions = prev.wallet?.transactions || [];
      const newTx = {
        id: `tx-wd-${Date.now()}`,
        type: 'WITHDRAWAL',
        title: `Retiro a ${method.toUpperCase()}`,
        subtitle: accountNumber ? `Cuenta/Cel: ${accountNumber}` : 'Transferencia procesada',
        amount: -amountNum,
        status: 'COMPLETED',
        date: 'Hoy',
        icon: 'withdraw',
      };

      return {
        ...prev,
        wallet: {
          ...prev.wallet,
          balanceCOP: Math.max(0, (prev.wallet?.balanceCOP || 0) - amountNum),
          transactions: [newTx, ...currentTransactions],
        },
      };
    });
  };

  // 🔥 Handle Video Promotion (In-Feed Ads con cobro real, paquetes y segmentación)
  const handlePromoteSuccess = ({
    videoId,
    budget,
    goal,
    city,
    paymentMethod,
    duration,
    promotedCta,
    campaignType,
    couponCode,
    packTitle,
  }) => {
    // 1. Descontar fondos reales si pagó con Billetera o Monedas
    if (paymentMethod === 'wallet') {
      setCurrentUser((prev) => {
        const currentTransactions = prev.wallet?.transactions || [];
        const newTx = {
          id: `tx-promo-${Date.now()}`,
          type: 'AD_CAMPAIGN',
          title: `Pauta: ${packTitle || 'Campaña Spot'}`,
          subtitle: `In-Feed Ad · ${goal}`,
          amount: -Number(budget),
          status: 'COMPLETED',
          date: 'Hoy',
          icon: 'ad',
        };

        return {
          ...prev,
          wallet: {
            ...prev.wallet,
            balanceCOP: Math.max(0, (prev.wallet?.balanceCOP || 0) - budget),
            transactions: [newTx, ...currentTransactions],
          },
        };
      });
    } else if (paymentMethod === 'coins') {
      const coinsCost = Math.round(budget / 1000);
      setCurrentUser((prev) => ({
        ...prev,
        wallet: {
          ...prev.wallet,
          coins: Math.max(0, (prev.wallet?.coins || 0) - coinsCost),
        },
      }));
    }

    // 2. Marcar video como promocionado con datos enriquecidos de campaña publicitaria
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? {
              ...v,
              isPromoted: true,
              promotedCta,
              promotedCity: city,
              promotedBudget: budget,
              promotedGoal: goal,
              campaignType: campaignType || goal,
              couponCode: couponCode || 'SPOT15',
              packTitle: packTitle || null,
              promotedDuration: duration || 3,
              promotedAt: Date.now(),
            }
          : v
      )
    );
  };

  // 🔴 Handle Live Stream Finished
  const handleFinishLive = ({ earnedCOP, giftsCount }) => {
    if (earnedCOP > 0) {
      setCurrentUser((prev) => {
        const currentTransactions = prev.wallet?.transactions || [];
        const newTx = {
          id: `tx-live-${Date.now()}`,
          type: 'LIVE_GIFT',
          title: `Ganancia en LIVE (${giftsCount || 1} regalos)`,
          subtitle: `Monetización de transmisión en vivo`,
          amount: earnedCOP,
          status: 'COMPLETED',
          date: 'Hoy',
          icon: 'gift',
        };

        return {
          ...prev,
          wallet: {
            ...prev.wallet,
            balanceCOP: (prev.wallet?.balanceCOP || 0) + earnedCOP,
            giftEarningsCOP: (prev.wallet?.giftEarningsCOP || 0) + earnedCOP,
            transactions: [newTx, ...currentTransactions],
          },
        };
      });
    }
  };

  // 🔐 Handle Auth Success
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    savePersistedUser(user);
  };

  // 🚪 Handle Logout
  const handleLogout = () => {
    if (confirm('¿Deseas cerrar sesión para ingresar con otra cuenta?')) {
      const guestUser = {
        id: 'guest',
        name: 'Invitado',
        username: 'invitado',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        bio: 'Modo invitado. ¡Inicia sesión para subir videos y ganar dinero!',
        followingCount: 0,
        followersCount: '0',
        likesCount: '0',
        wallet: {
          balanceCOP: 0,
          coins: 0,
          affiliateEarningsCOP: 0,
          giftEarningsCOP: 0,
          pendingCOP: 0,
        },
      };
      setCurrentUser(guestUser);
      savePersistedUser(guestUser);
      setIsAuthOpen(true);
    }
  };

  // 🔇 Control estricto de reproducción de videos del feed:
  // Se pausa INMEDIATAMENTE si el usuario abre la cámara, el menú de creación (+), el Live, la subida, historias o cualquier modal,
  // impidiendo por completo que el sonido del Reel se cuele en la grabación o en vivo.
  const isFeedPlaybackActive =
    isWindowVisible &&
    currentTab === 'feed' &&
    !activeCreatorProfile &&
    !activeChatPartner &&
    !isCreateMenuOpen &&
    !isCameraOpen &&
    !isLiveStudioOpen &&
    !isUploadOpen &&
    !isAdminOpen &&
    !isStoriesOpen &&
    !activeAudioDetail &&
    !isWalletOpen &&
    !activeCommentVideo &&
    !activeShareVideo &&
    !activeGiftsCreator &&
    !activePromoteVideo &&
    !isAuthOpen &&
    !isEditProfileOpen &&
    !editingVideo &&
    !isAdMobRewardedOpen;

  // 🔇 Asegurar que ningún video secundario emita sonido ni se reproduzca en segundo plano
  useEffect(() => {
    if (containerRef.current) {
      const allVideos = containerRef.current.querySelectorAll('video');
      allVideos.forEach((vid) => {
        const cardParent = vid.closest('[data-index]');
        const cardIndex = cardParent ? Number(cardParent.getAttribute('data-index')) : -1;

        if (!isFeedPlaybackActive || (cardIndex !== -1 && cardIndex !== activeVideoIndex)) {
          if (!vid.paused) {
            vid.pause();
          }
          vid.muted = true;
        }
      });
    }
  }, [activeVideoIndex, isFeedPlaybackActive]);

  return (
    <div className="w-full h-[100dvh] bg-[#07080b] flex items-center justify-center p-0 sm:p-4 overflow-hidden font-sans relative">
      {/* 🌈 ILUMINACIÓN AMBIENTAL DINÁMICA (Ambient Glow de fondo) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[750px] bg-[#FE2C55]/15 rounded-full blur-[160px]" />
      </div>

      {/* Mobile Shell Frame */}
      <main className="relative w-full max-w-[420px] h-[100dvh] sm:h-[94vh] sm:max-h-[880px] bg-black sm:rounded-3xl sm:border-[5px] sm:border-zinc-800 shadow-[0_0_60px_rgba(254,44,85,0.2)] overflow-hidden flex flex-col z-10">
        {/* Dynamic Island / Speaker */}
        <div className="hidden sm:block absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-zinc-900 rounded-full z-40 pointer-events-none border border-white/5" />

        {/* 📢 Banner Interactivo de Difusión Masiva Push (Enviado desde Admin Master Dashboard) */}
        {activeBroadcastBanner && (
          <div className="absolute top-3 left-3 right-3 z-50 bg-[#14151a]/95 backdrop-blur-xl border border-amber-400/60 rounded-2xl p-3 shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex items-start gap-2.5 animate-in slide-in-from-top-4 duration-300">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-[#FE2C55] flex items-center justify-center shrink-0 text-black shadow-md">
              <Bell size={16} className="animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[10px] text-amber-300 flex items-center gap-1 uppercase tracking-wide">
                  👑 Comunicado Oficial Spot Play
                </span>
                <span className="text-[9px] text-zinc-400 font-mono">{activeBroadcastBanner.timestamp}</span>
              </div>
              <h4 className="text-xs font-bold text-white mt-0.5 truncate">{activeBroadcastBanner.title}</h4>
              <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug line-clamp-2">{activeBroadcastBanner.message}</p>
            </div>
            <button
              onClick={() => setActiveBroadcastBanner(null)}
              className="p-1 text-zinc-400 hover:text-white shrink-0"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Floating Screen Gift Celebration Overlay */}
        {screenGiftAnimation && (
          <div className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center animate-in zoom-in-50 duration-300">
            <span className="text-8xl animate-bounce filter drop-shadow-[0_0_35px_rgba(254,44,85,0.9)]">
              {screenGiftAnimation.emoji}
            </span>
            <div className="mt-4 px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-amber-400/50 text-white text-xs font-bold shadow-2xl flex items-center gap-1.5">
              <span>¡Enviaste {screenGiftAnimation.name} a @{screenGiftAnimation.creatorName}!</span>
            </div>
          </div>
        )}

        {/* FEED VIEW (Mantiene la memoria del DOM y posición de scroll) */}
        <div className={`relative w-full h-full flex flex-col ${currentTab === 'feed' ? '' : 'hidden'}`}>
          <HeaderNav
            activeFeedTab={feedFilter}
            onSelectFeedTab={handleSelectFeedTab}
            onOpenSearch={() => setCurrentTab('explore')}
            onOpenCreateMenu={() => setIsCreateMenuOpen(true)}
            onToggleStories={() => setIsStoriesOpen((prev) => !prev)}
            isStoriesOpen={isStoriesOpen}
            onOpenAdmin={handleRequestMasterAccess}
            onRequestMasterAccess={handleRequestMasterAccess}
            followingCount={uniqueCreators.filter((c) => c.isFollowing).length}
            onLogoClick={() => {
              // Tocar el logo re-baraja aleatoriamente el feed y sube al primer video sorpresa
              handleShuffleFeed();
            }}
          />

            {/* 🔴 BARRA DE CREADORES EN VIVO / HISTORIAS */}
            {isStoriesOpen && (
              <div className="absolute top-[max(48px,calc(env(safe-area-inset-top,10px)+42px))] left-0 right-0 z-30 bg-black/85 backdrop-blur-xl border-b border-white/10 py-1.5 animate-in slide-in-from-top duration-200">
                <StoriesBar
                  creators={uniqueCreators}
                  onSelectCreator={(creator) => {
                    handleOpenCreatorOrMyProfile(creator);
                    setIsStoriesOpen(false);
                  }}
                />
              </div>
            )}

            {/* 🔙 Botón Flotante para Regresar al Perfil del Creador tras ver su video */}
            {returnToCreatorProfile && currentTab === 'feed' && (
              <div className="absolute top-[max(54px,calc(env(safe-area-inset-top,10px)+46px))] left-3 z-30 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenCreatorOrMyProfile(returnToCreatorProfile);
                    setReturnToCreatorProfile(null);
                  }}
                  className="px-3 py-1.5 rounded-full bg-black/85 hover:bg-black backdrop-blur-xl border border-white/25 text-white text-[11px] font-extrabold flex items-center gap-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.7)] active:scale-95 transition-all cursor-pointer animate-in slide-in-from-top-2"
                  title={`Volver al canal de @${returnToCreatorProfile.username}`}
                >
                  <ArrowLeft size={13} className="text-[#ffb800]" />
                  <span className="truncate max-w-[170px]">Volver a @{returnToCreatorProfile.username}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReturnToCreatorProfile(null)}
                  className="w-6 h-6 rounded-full bg-black/80 hover:bg-white/20 border border-white/20 text-zinc-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
                  title="Cerrar retorno"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Vertical Video Scroll Container */}
            <div
              ref={containerRef}
              className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black"
            >
              {displayedVideos.length > 0 ? (
                displayedVideos.map((video, index) => (
                  <div
                    key={video.feedInstanceId || `${video.id}-${index}`}
                    ref={(el) => (videoRefs.current[index] = el)}
                    data-index={index}
                    className="w-full h-full snap-start snap-always relative shrink-0"
                  >
                    <VideoCard
                      video={video}
                      isActive={isFeedPlaybackActive && activeVideoIndex === index}
                      preloadMode={
                        activeVideoIndex === index
                          ? 'auto'
                          : Math.abs(activeVideoIndex - index) === 1
                          ? 'metadata'
                          : 'none'
                      }
                      shouldMountMedia={Math.abs(activeVideoIndex - index) <= 1}
                      isMuted={isMuted}
                      onToggleMute={() => setIsMuted((prev) => !prev)}
                      onToggleLike={handleToggleLike}
                      onToggleBookmark={handleToggleBookmark}
                      onToggleFollow={handleToggleFollow}
                      onOpenComments={setActiveCommentVideo}
                      onOpenShare={setActiveShareVideo}
                      onOpenAudioDetail={setActiveAudioDetail}
                      onOpenCreatorProfile={handleOpenCreatorOrMyProfile}
                      onOpenMyProfile={() => setCurrentTab('profile')}
                      onEditVideo={handleOpenEditVideo}
                      currentUser={currentUser}
                      onOpenGifts={(author) => setActiveGiftsCreator(author)}
                      onOpenPromote={(vid) => setActivePromoteVideo(vid)}
                      onOpenDirectChat={(creator) => setActiveChatPartner(creator)}
                      currentUserId={currentUser.id}
                      onOpenReport={handleOpenReport}
                    />
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-white">
                  <p className="text-base font-extrabold mb-1">Aún no sigues a creadores</p>
                  <p className="text-xs text-zinc-400 mb-4 max-w-xs">
                    Sigue a tus creadores favoritos aquí abajo o explora la pestaña "Para ti".
                  </p>

                  {/* Tarjetas rápidas de creadores sugeridos */}
                  <div className="w-full max-w-xs space-y-2 mb-5">
                    {uniqueCreators
                      .filter((c) => c.id !== 'me' && c.id !== currentUser.id)
                      .slice(0, 3)
                      .map((creator) => (
                        <div
                          key={creator.id}
                          onClick={() => handleOpenCreatorOrMyProfile(creator)}
                          className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between cursor-pointer hover:border-[#ffb800]/40 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2 text-left">
                            <img
                              src={creator.avatar}
                              alt={creator.username}
                              className="w-10 h-10 rounded-full object-cover border border-[#ffb800]/40 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{creator.name}</p>
                              <p className="text-[10px] text-zinc-400 truncate">@{creator.username}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFollow(creator.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#ffb800] to-[#ff8800] text-black font-extrabold text-[11px] shrink-0 shadow-md active:scale-95"
                          >
                            + Seguir
                          </button>
                        </div>
                      ))}
                  </div>

                  <button
                    onClick={() => handleSelectFeedTab('foryou')}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-full text-xs font-bold active:scale-95 transition-all"
                  >
                    ✨ Volver a Para ti
                  </button>
                </div>
              )}
            </div>
        </div>

        {/* EXPLORE / BÚSQUEDA VIEW */}
        {currentTab === 'explore' && (
          <ExploreView
            videos={videos}
            onSelectVideo={handleSelectVideo}
            onSelectCreator={handleOpenCreatorOrMyProfile}
            onToggleFollow={handleToggleFollow}
            onBack={() => setCurrentTab('feed')}
          />
        )}

        {/* INBOX VIEW */}
        {currentTab === 'inbox' && <InboxView onOpenChat={setActiveChatPartner} />}

        {/* PROFILE VIEW */}
        {currentTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            userVideos={videos.filter((v) => v.author?.id === currentUser.id || v.author?.username === currentUser.username || v.author?.id === 'me')}
            bookmarkedVideos={videos.filter((v) => v.isBookmarked)}
            likedVideos={videos.filter((v) => v.isLiked)}
            onSelectVideo={handleSelectVideo}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onOpenWallet={() => setIsWalletOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
            onLogout={handleLogout}
            onOpenAdmin={() => setIsAdminOpen(true)}
            isMasterAdminAuthenticated={isMasterAdminAuthenticated}
            onRequestMasterAccess={handleRequestMasterAccess}
            onLockMasterAdmin={handleLockMasterAdmin}
            initialTab={profileInitialTab}
            onExploreVideos={() => setCurrentTab('feed')}
            followedCreatorsList={uniqueCreators.filter((c) => c.isFollowing)}
            allCreatorsList={uniqueCreators.filter((c) => c.id !== 'me' && c.id !== currentUser.id)}
            onToggleFollow={handleToggleFollow}
            onOpenCreatorProfile={handleOpenCreatorOrMyProfile}
            onEditVideo={handleOpenEditVideo}
            onOpenInbox={() => setCurrentTab('inbox')}
            onOpenVitrina={() => setCurrentTab('vitrina')}
          />
        )}

        {/* VITRINA COMERCIAL (INTEGRACIÓN VITRINASPOT CON SSO AUTOMÁTICO) */}
        {currentTab === 'vitrina' && (
          <Suspense fallback={<div className="w-full h-full bg-[#0c0f14] flex flex-col items-center justify-center text-white text-xs gap-2"><div className="w-8 h-8 border-2 border-[#ffb800]/20 border-t-[#ffb800] rounded-full animate-spin"></div><span>Abriendo Vitrina Comercial...</span></div>}>
            <VitrinaView
              currentUser={currentUser}
              onBack={() => setCurrentTab('feed')}
            />
          </Suspense>
        )}

        {/* ⭐ TOAST FLOTANTE INTERACTIVO DE FAVORITOS (TIKTOK STYLE) */}
        {bookmarkToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-black/90 backdrop-blur-md border border-amber-400/40 text-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${bookmarkToast.isBookmarked ? 'bg-amber-400 text-black shadow' : 'bg-zinc-700 text-zinc-300'}`}>
              <Bookmark size={13} className={bookmarkToast.isBookmarked ? 'fill-black' : ''} />
            </div>
            <span className="whitespace-nowrap">{bookmarkToast.message}</span>
            {bookmarkToast.isBookmarked && (
              <button
                onClick={() => {
                  setBookmarkToast(null);
                  setProfileInitialTab('bookmarks');
                  setCurrentTab('profile');
                }}
                className="ml-1 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-full text-[11px] flex items-center gap-1 active:scale-95 transition-all shadow"
              >
                <span>Ver</span>
                <ArrowRight size={11} />
              </button>
            )}
          </div>
        )}

        {/* 👤 TOAST FLOTANTE PROFESIONAL DE SEGUIR (TIKTOK STYLE) */}
        {followToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-black/90 backdrop-blur-md border border-cyan-400/40 text-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${followToast.isFollowing ? 'bg-cyan-400 text-black shadow' : 'bg-zinc-700 text-zinc-300'}`}>
              {followToast.isFollowing ? <Check size={13} strokeWidth={3} /> : <UserCheck size={13} />}
            </div>
            <span>{followToast.message}</span>
          </div>
        )}



        {/* Bottom Navigation */}
        <BottomNav
          activeTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'profile') setProfileInitialTab('videos');
            if (tab === 'feed' && currentTab === 'feed') {
              handleShuffleFeed();
            }
            setCurrentTab(tab);
          }}
          onOpenCreateMenu={() => setIsCreateMenuOpen(true)}
        />

        {/* 🚀 Radial Create Menu Modal */}
        <CreateMenuModal
          isOpen={isCreateMenuOpen}
          currentUser={currentUser}
          onClose={() => setIsCreateMenuOpen(false)}
          onRecordVideo={() => {
            setUploadPreFill({ videoUrl: null, sound: null });
            setIsCameraOpen(true);
          }}
          onSellProduct={() => {
            setIsCreateMenuOpen(false);
            setCurrentTab('vitrina');
          }}
          onUploadVideo={() => {
            setUploadPreFill({ videoUrl: null, sound: null });
            setIsUploadOpen(true);
          }}
          onGoLive={() => {
            setIsLiveStudioOpen(true);
          }}
        />

        {/* Comments Drawer Modernizado con SpotShop, Respuestas e Insignias */}
        <CommentsDrawer
          isOpen={Boolean(activeCommentVideo)}
          video={activeCommentVideo}
          currentUser={currentUser}
          onClose={() => setActiveCommentVideo(null)}
          onAddComment={handleAddComment}
          onToggleCommentLike={handleToggleCommentLike}
          onOpenCreatorProfile={handleOpenCreatorOrMyProfile}
        />

        {/* Share Modal */}
        <ShareModal
          isOpen={Boolean(activeShareVideo)}
          video={activeShareVideo}
          onClose={() => setActiveShareVideo(null)}
          onShareSuccess={handleShareSuccess}
          onOpenReport={handleOpenReport}
          onHideVideo={handleHideVideo}
        />

        {/* 🛡️ Report Modal (Obligatorio Google Play & AdMob) */}
        <ReportModal
          isOpen={Boolean(activeReportVideo)}
          video={activeReportVideo}
          onClose={() => setActiveReportVideo(null)}
          onSubmitReport={handleSubmitReport}
        />

        {/* Upload Modal with Monetization Tagging */}
        <UploadModal
          isOpen={isUploadOpen}
          initialVideoUrl={uploadPreFill.videoUrl}
          initialVideoBlob={uploadPreFill.videoBlob}
          initialSound={uploadPreFill.sound}
          currentUser={currentUser}
          onClose={() => {
            setIsUploadOpen(false);
            setIsMuted(false);
          }}
          onUploadSuccess={handleUploadSuccess}
          onOpenCamera={() => {
            setIsUploadOpen(false);
            setIsCameraOpen(true);
          }}
        />

        {/* Camera Recorder */}
        {isCameraOpen && (
          <Suspense fallback={null}>
            <CameraRecorder
              isOpen={isCameraOpen}
              onClose={() => setIsCameraOpen(false)}
              onFinishRecording={handleFinishRecording}
            />
          </Suspense>
        )}

        {/* Audio Detail Modal */}
        <AudioDetailModal
          isOpen={Boolean(activeAudioDetail)}
          sound={activeAudioDetail}
          videos={videos}
          onClose={() => setActiveAudioDetail(null)}
          onUseSound={handleUseSound}
          onSelectVideo={handleSelectVideo}
        />

        {/* Creator Profile View */}
        {activeCreatorProfile && (
          <CreatorProfileView
            creator={activeCreatorProfile}
            creatorVideos={videos.filter(
              (v) =>
                v.author?.id === activeCreatorProfile.id ||
                (activeCreatorProfile.username && v.author?.username === activeCreatorProfile.username)
            )}
            currentUser={currentUser}
            onBack={() => setActiveCreatorProfile(null)}
            onToggleFollow={handleToggleFollow}
            onSelectVideo={handleSelectVideo}
            onOpenMyProfile={() => {
              setActiveCreatorProfile(null);
              setCurrentTab('profile');
            }}
            onEditVideo={handleOpenEditVideo}
            onOpenMessage={(creator) => {
              setActiveCreatorProfile(null);
              setActiveChatPartner(creator);
            }}
            onOpenReport={handleOpenReport}
          />
        )}

        {/* Direct Messages Drawer */}
        <DirectMessagesDrawer
          isOpen={Boolean(activeChatPartner)}
          chatPartner={activeChatPartner}
          onClose={() => setActiveChatPartner(null)}
        />

        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={isEditProfileOpen}
          currentUser={currentUser}
          onClose={() => setIsEditProfileOpen(false)}
          onSave={setCurrentUser}
        />

        {/* ✏️ Modal Oficial para Editar Video Publicado */}
        <EditVideoModal
          isOpen={Boolean(editingVideo)}
          video={editingVideo}
          onClose={() => setEditingVideo(null)}
          onSave={handleSaveEditVideo}
          onDelete={handleDeleteVideo}
        />

        {/* 🎁 Virtual Gifts Drawer */}
        <GiftsDrawer
          isOpen={Boolean(activeGiftsCreator)}
          targetCreator={activeGiftsCreator}
          currentUserCoins={currentUser.wallet?.coins || 0}
          onClose={() => setActiveGiftsCreator(null)}
          onSendGift={handleSendGift}
          onRechargeCoins={handleRechargeCoins}
          onWatchAdForCoins={() => setIsAdMobRewardedOpen(true)}
        />

        {/* 📱 Modal Interactivo Google AdMob Rewarded Video Ad (100% Play Store Safe) */}
        <AdMobRewardedModal
          isOpen={isAdMobRewardedOpen}
          onClose={() => setIsAdMobRewardedOpen(false)}
          onRewardEarned={(earnedCoins) => {
            handleRechargeCoins(earnedCoins);
            setOrderToast({ message: `🎉 ¡Ganaste +${earnedCoins} SpotCoins por ver el anuncio patrocinador!` });
            setTimeout(() => setOrderToast(null), 3500);
          }}
        />

        {/* 💰 Creator Wallet Modal */}
        <CreatorWalletModal
          isOpen={isWalletOpen}
          wallet={currentUser.wallet}
          receivedGifts={currentUser.receivedGifts}
          onClose={() => setIsWalletOpen(false)}
          onWithdrawSuccess={handleWithdrawSuccess}
          onWatchAdForCoins={() => {
            setIsWalletOpen(false);
            setIsAdMobRewardedOpen(true);
          }}
        />

        {/* 🔥 Promote Video Modal (Publicidad con Billetera, Nequi y Segmentación) */}
        <PromoteVideoModal
          isOpen={Boolean(activePromoteVideo)}
          video={activePromoteVideo}
          currentUser={currentUser}
          onClose={() => setActivePromoteVideo(null)}
          onPromoteSuccess={handlePromoteSuccess}
        />
        {/* 🔐 Auth Modal (Login / Registro) */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />

        {/* 📡 Live Studio Modal (Transmisión en Vivo) */}
        {isLiveStudioOpen && (
          <Suspense fallback={null}>
            <LiveStreamModal
              isOpen={isLiveStudioOpen}
              currentUser={currentUser}
              onClose={() => setIsLiveStudioOpen(false)}
              onFinishLive={handleFinishLive}
            />
          </Suspense>
        )}

        {/* 👑 Panel Maestro de Administrador (Streaming, Moderación, Creadores y Retiros Nequi) */}
        {isAdminOpen && (
          <Suspense fallback={null}>
            <AdminMasterDashboard
              isOpen={isAdminOpen}
              onClose={() => setIsAdminOpen(false)}
              currentUser={currentUser}
              creators={uniqueCreators}
              videos={videos}
              onToggleVerification={handleToggleVerification}
              onTogglePinVideo={handleTogglePinVideo}
              onToggleHideVideo={handleToggleHideVideo}
              onBroadcastNotification={handleBroadcastNotification}
              onLock={handleLockMasterAdmin}
              onChangePin={() => setIsMasterPinModalOpen(true)}
            />
          </Suspense>
        )}

        {/* 🔐 Modal de PIN de Seguridad Maestro (Solo Dueño) */}
        <MasterPinModal
          isOpen={isMasterPinModalOpen}
          onClose={() => setIsMasterPinModalOpen(false)}
          onSuccess={handleMasterPinSuccess}
        />

        {/* 📲 Banner Flotante de Instalación PWA (Descargar App / Modo Standalone sin buscador) */}
        <PwaInstallBanner />
      </main>
    </div>
  );
}
