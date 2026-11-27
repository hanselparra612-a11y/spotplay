// Capa de persistencia en LocalStorage para guardar cambios offline y mantener datos
import { INITIAL_VIDEOS, CURRENT_USER, SEED_CREATORS_MAP } from '../data/mockVideos.js';

// Purga forzada de caché para eliminar perfiles/videos de prueba antiguos y limpiar likes automáticos residuales
const PURGE_KEY = 'spotplay_purge_v8_clean_likes_white';
if (typeof window !== 'undefined' && localStorage.getItem(PURGE_KEY) !== 'done') {
  try {
    localStorage.removeItem('spotplay_videos_v1');
    localStorage.removeItem('spotplay_videos_v2');
    localStorage.removeItem('spotplay_videos_v3');
    localStorage.removeItem('spotplay_videos_offline_v2');
    localStorage.removeItem('spotplay_followed_creator_ids_v1');
    localStorage.removeItem('toktik_videos_1986_v2');
    localStorage.removeItem('spotplay_likes_v1');
    localStorage.removeItem('spotplay_likes_v2');
    // Sanitizar metadatos de videos subidos en localStorage para que los corazones inicien blancos (isLiked: false, likes: 0)
    const metaRaw = localStorage.getItem('spotplay_user_uploaded_meta_v2');
    if (metaRaw) {
      const metaList = JSON.parse(metaRaw);
      if (Array.isArray(metaList)) {
        const cleanedMeta = metaList.map((v) => ({
          ...v,
          isLiked: false,
          stats: { ...(v.stats || {}), likes: 0 },
        }));
        localStorage.setItem('spotplay_user_uploaded_meta_v2', JSON.stringify(cleanedMeta));
      }
    }
    localStorage.setItem(PURGE_KEY, 'done');
  } catch (e) {}
}

const VIDEOS_STORAGE_KEY = 'spotplay_videos_v4';
const USER_STORAGE_KEY = 'spotplay_user_v2';
const ORDERS_STORAGE_KEY = 'spotplay_orders_v2';
const BOOKMARKS_STORAGE_KEY = 'spotplay_bookmarks_v2';
const LIKES_STORAGE_KEY = 'spotplay_likes_v3';
const REPORTS_STORAGE_KEY = 'spotplay_reports_v1';
const BLOCKED_USERS_STORAGE_KEY = 'spotplay_blocked_users_v1';
const DELETED_VIDEOS_KEY = 'spotplay_deleted_video_ids_v2';

export function getDeletedVideoIds() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(DELETED_VIDEOS_KEY) : null;
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markVideoAsDeleted(id, description = '') {
  if (!id && !description) return;
  try {
    const set = getDeletedVideoIds();
    if (id) set.add(String(id));
    localStorage.setItem(DELETED_VIDEOS_KEY, JSON.stringify(Array.from(set)));

    // Limpiar también de spotplay_user_uploaded_meta_v2 para que no resucite
    try {
      const metaKey = 'spotplay_user_uploaded_meta_v2';
      const existingMeta = JSON.parse(localStorage.getItem(metaKey) || '[]');
      const filtered = existingMeta.filter((v) => {
        if (id && v.id === id) return false;
        if (v.description && typeof v.description === 'string' && v.description.toLowerCase().includes('piloto')) return false;
        return true;
      });
      localStorage.setItem(metaKey, JSON.stringify(filtered));
    } catch {}
  } catch {}
}

// Claves legadas para migración transparente sin pérdida de datos
const LEGACY_VIDEOS_KEY = 'toktik_videos_1986_v2';
const LEGACY_USER_KEY = 'toktik_user_1986_v2';
const LEGACY_ORDERS_KEY = 'toktik_orders_1986_v1';

export const INITIAL_SAMPLE_ORDERS = [
  {
    orderId: 'DIR-849201',
    productName: 'Chaqueta Streetwear Rompevientos',
    storeName: 'Urban Streetwear SAS',
    storeCity: 'Medellín',
    storeWhatsapp: '573128525929',
    selectedSize: 'M',
    selectedColor: 'Negro Puro',
    quantity: 1,
    status: 'WHATSAPP_CONTACTED', // Contactado por WhatsApp
    totalPaid: 159000,
    commissionPercent: 10,
    commissionEarned: 15900,
    creatorUsername: 'carolina_style',
    date: 'Hoy',
    type: 'DIRECT_SHOWCASE',
  },
  {
    orderId: 'DIR-739102',
    productName: 'Combo Burger Master Doble Carne + Papas',
    storeName: 'Burger Master Artesanal',
    storeCity: 'Medellín',
    storeWhatsapp: '573147772211',
    selectedSize: 'Individual',
    selectedColor: 'Salsa Especial',
    quantity: 2,
    status: 'DELIVERED', // Entregado a satisfacción
    totalPaid: 64000,
    commissionPercent: 8,
    commissionEarned: 5120,
    creatorUsername: 'valeria_fit',
    date: 'Ayer',
    type: 'DIRECT_SHOWCASE',
  },
];

export function loadPersistedOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY) || localStorage.getItem(LEGACY_ORDERS_KEY);
    if (!raw) return INITIAL_SAMPLE_ORDERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SAMPLE_ORDERS;
  } catch (err) {
    return INITIAL_SAMPLE_ORDERS;
  }
}

export function savePersistedOrders(orders) {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.warn('Error al guardar pedidos:', err);
  }
}

export function loadPersistedBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function savePersistedBookmarks(bookmarkIds) {
  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarkIds));
  } catch (err) {
    console.warn('Error al guardar favoritos en localStorage:', err);
  }
}

export function loadPersistedLikes() {
  try {
    const raw = localStorage.getItem(LIKES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function savePersistedLikes(likedIds) {
  try {
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likedIds));
  } catch (err) {
    console.warn('Error al guardar likes en localStorage:', err);
  }
}

export function loadPersistedVideos() {
  try {
    const raw = localStorage.getItem(VIDEOS_STORAGE_KEY);
    const bookmarkedIds = new Set(loadPersistedBookmarks());
    const likedIds = new Set(loadPersistedLikes());
    let list = INITIAL_VIDEOS;
    if (raw) {
      const parsed = JSON.parse(raw);
      const mockAuthors = [
        'sofia_creative', 'valeria_fit', 'elparce_humor', 'burgermaster_oficial',
        'camila_nails', 'chef_mateo', 'daniel_beats', 'andres_tech',
        'lucia_travels', 'santiago_fitness', 'elena_pastry', 'felipe_art',
        'mariana_dance', 'alejo_skate', 'isa_makeup', 'david_gamestudio',
        'cata_yoga', 'juanma_tatuajes'
      ];
      const deletedIds = getDeletedVideoIds();
      const cleaned = Array.isArray(parsed)
        ? parsed.filter((v) => {
            // Descartar videos eliminados permanentemente o que contengan 'piloto'
            if (deletedIds.has(v.id)) return false;
            if (v.description && typeof v.description === 'string' && v.description.toLowerCase().includes('piloto')) return false;
            // Descartar videos mock de prueba antiguos
            if (v.id && (v.id.startsWith('vid-') || v.id.startsWith('demo-'))) return false;
            if (v.author && mockAuthors.includes(v.author.username)) return false;
            return true;
          })
        : [];

      // Integrar metadatos de videos subidos por el usuario desde el backup v2
      try {
        const userMetaRaw = localStorage.getItem('spotplay_user_uploaded_meta_v2');
        if (userMetaRaw) {
          const userMetaList = JSON.parse(userMetaRaw);
          if (Array.isArray(userMetaList) && userMetaList.length > 0) {
            const currentIds = new Set(cleaned.map((v) => v.id));
            userMetaList.forEach((uVid) => {
              if (
                !currentIds.has(uVid.id) &&
                !deletedIds.has(uVid.id) &&
                !(uVid.description && typeof uVid.description === 'string' && uVid.description.toLowerCase().includes('piloto'))
              ) {
                cleaned.unshift(uVid);
                currentIds.add(uVid.id);
              }
            });
          }
        }
      } catch (uErr) {}

      if (cleaned.length > 0) {
        // Asegurar que si INITIAL_VIDEOS tiene nuevos videos subidos, se incluyan siempre
        const existingIds = new Set(cleaned.map((v) => v.id));
        const missingFromInitial = INITIAL_VIDEOS.filter((v) => !existingIds.has(v.id) && !deletedIds.has(v.id) && !v.description?.toLowerCase().includes('piloto'));
        list = [...missingFromInitial, ...cleaned];
      }
    }
    const deletedIds = getDeletedVideoIds();
    return list.filter((v) => !deletedIds.has(v.id) && !v.description?.toLowerCase().includes('piloto')).map((v) => {
      const { product, isPromoted, promotedCta, ...cleanVid } = v;
      const realCommentsList = (v.comments || []).map((c) => ({
        ...c,
        text: typeof c.text === 'string'
          ? c.text.replace(/por Coordinadora/gi, 'por WhatsApp a la tienda').replace(/VideoSpot/gi, 'Spot Play').replace(/SpotPlay/gi, 'Spot Play')
          : c.text,
      }));
      const realCommentsCount = realCommentsList.reduce(
        (acc, curr) => acc + 1 + (curr.replies?.length || 0),
        0
      );

      const isBookmarked = bookmarkedIds.has(v.id);
      const isLiked = likedIds.has(v.id);
      const hasUserGifted = Boolean(v.hasUserGifted);

      // 🎯 MODO REAL ESTRICTO: Los likes dependen exclusivamente de las acciones reales del usuario
      const rawLikes = typeof v.stats?.likes === 'number' ? v.stats.likes : 0;
      const cleanLikes = isLiked ? (rawLikes > 0 ? rawLikes : 1) : 0;

      const rawBookmarks = typeof v.stats?.bookmarks === 'number' ? v.stats.bookmarks : 0;
      const cleanBookmarks = rawBookmarks > 99 ? (isBookmarked ? 1 : 0) : rawBookmarks;

      const rawShares = typeof v.stats?.shares === 'number' ? v.stats.shares : 0;
      const cleanShares = rawShares > 99 ? 0 : rawShares;

      const rawGifts = typeof v.stats?.giftsCount === 'number' ? v.stats.giftsCount : 0;
      const cleanGifts = rawGifts > 99 ? (hasUserGifted ? 1 : 0) : rawGifts;

      // Saneamiento de autor a Modo Real
      const cleanAuthor = v.author
        ? {
            ...v.author,
            followersCount: typeof v.author.followersCount === 'number' ? v.author.followersCount : 0,
            followingCount: typeof v.author.followingCount === 'number' ? v.author.followingCount : 0,
            likesCount: typeof v.author.likesCount === 'number' ? v.author.likesCount : 0,
          }
        : v.author;

      return {
        ...cleanVid,
        author: cleanAuthor,
        isBookmarked,
        isLiked,
        hasUserGifted,
        stats: {
          ...v.stats,
          likes: cleanLikes,
          comments: realCommentsCount,
          bookmarks: cleanBookmarks,
          shares: cleanShares,
          giftsCount: cleanGifts,
        },
        comments: realCommentsList,
        tags: Array.isArray(v.tags) ? v.tags.map((t) => (t === 'videospot' ? 'spotplay' : t)) : v.tags,
      };
    });
  } catch (err) {
    console.warn('Error al leer videos de localStorage:', err);
    return INITIAL_VIDEOS;
  }
}

export function savePersistedVideos(videos) {
  try {
    // Preservar los videos del usuario sin persistir URLs efímeras de blobs muertas en localStorage
    const serializableVideos = (videos || [])
      .map(({ product, isPromoted, promotedCta, ...cleanVid }) => {
        let cleanAuthor = cleanVid.author;
        if (cleanAuthor && typeof cleanAuthor.avatar === 'string' && cleanAuthor.avatar.startsWith('data:image')) {
          cleanAuthor = { ...cleanAuthor, avatar: '/default-avatar.png' };
        }
        const safeUrl = (cleanVid.videoUrl && cleanVid.videoUrl.startsWith('blob:')) ? '' : cleanVid.videoUrl;
        return { ...cleanVid, videoUrl: safeUrl, author: cleanAuthor };
      });
    localStorage.setItem(VIDEOS_STORAGE_KEY, JSON.stringify(serializableVideos));
  } catch (err) {
    console.warn('Error al guardar videos en localStorage:', err);
  }
}

export function loadPersistedUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return CURRENT_USER;
    const parsed = JSON.parse(raw);
    const rawTransactions =
      parsed.wallet?.transactions && parsed.wallet.transactions.length > 0
        ? parsed.wallet.transactions
        : CURRENT_USER.wallet.transactions;

    // Limpieza estricta de campos COP obsoletos y unificación 100% en SpotCoins
    const cleanCoins = (typeof parsed.wallet?.coins === 'number' && !isNaN(parsed.wallet.coins))
      ? parsed.wallet.coins
      : ((typeof parsed.coins === 'number' && !isNaN(parsed.coins)) ? parsed.coins : CURRENT_USER.wallet.coins);

    const cleanWallet = {
      coins: cleanCoins,
      totalGiftsReceivedCoins:
        typeof parsed.wallet?.totalGiftsReceivedCoins === 'number'
          ? parsed.wallet.totalGiftsReceivedCoins
          : CURRENT_USER.wallet.totalGiftsReceivedCoins,
      adMobRewardsWatched:
        typeof parsed.wallet?.adMobRewardsWatched === 'number'
          ? parsed.wallet.adMobRewardsWatched
          : CURRENT_USER.wallet.adMobRewardsWatched,
      transactions: rawTransactions.map((tx) => ({
        ...tx,
        coins: tx.coins || (tx.amount ? Math.round(tx.amount / 50) : 5),
        subtitle: typeof tx.subtitle === 'string' ? tx.subtitle.replace(/VideoSpot/gi, 'Spot Play').replace(/SpotPlay/gi, 'Spot Play') : tx.subtitle,
      })),
    };

    const isRealAvatar = parsed.avatar && typeof parsed.avatar === 'string' && parsed.avatar.startsWith('data:image');
    const cleanFollowers = typeof parsed.followersCount === 'number' ? parsed.followersCount : 0;
    const cleanFollowing = typeof parsed.followingCount === 'number' ? parsed.followingCount : 0;
    const cleanLikes = typeof parsed.likesCount === 'number' ? parsed.likesCount : 0;

    const cleanId = (!parsed.id || parsed.id === 'me') ? CURRENT_USER.id : parsed.id;
    const cleanName = (!parsed.name || parsed.name === 'Mi Perfil Creador' || parsed.name === 'nuevo_creador') ? CURRENT_USER.name : parsed.name;
    const cleanUsername = (!parsed.username || parsed.username === 'nuevo_creador' || parsed.username === 'mi_spotplay') ? CURRENT_USER.username : parsed.username;

    return {
      ...CURRENT_USER,
      ...parsed,
      id: cleanId,
      name: cleanName,
      username: cleanUsername,
      followersCount: cleanFollowers,
      followingCount: cleanFollowing,
      baseLikesCount: 0,
      likesCount: cleanLikes,
      avatar: isRealAvatar ? parsed.avatar : CURRENT_USER.avatar,
      bio: typeof parsed.bio === 'string' ? parsed.bio.replace(/VideoSpot/gi, 'Spot Play').replace(/SpotPlay/gi, 'Spot Play') : CURRENT_USER.bio,
      coins: cleanCoins,
      wallet: cleanWallet,
      receivedGifts:
        parsed.receivedGifts && parsed.receivedGifts.length > 0
          ? parsed.receivedGifts
          : CURRENT_USER.receivedGifts || [],
    };
  } catch (err) {
    return CURRENT_USER;
  }
}

export function savePersistedUser(user) {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

    // Sincronizar el perfil con el servidor compartido
    if (user && user.id && user.id !== 'guest') {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('Error al guardar usuario en localStorage:', err);
  }
}

// 🛡️ Moderación y Denuncias de la Comunidad (Obligatorio Google Play & AdMob)
export function loadPersistedReports() {
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function savePersistedReports(reports) {
  try {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch (err) {
    console.warn('Error al guardar denuncias en localStorage:', err);
  }
}

export function loadPersistedBlockedUsers() {
  try {
    const raw = localStorage.getItem(BLOCKED_USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function savePersistedBlockedUsers(blockedList) {
  try {
    localStorage.setItem(BLOCKED_USERS_STORAGE_KEY, JSON.stringify(blockedList));
  } catch (err) {
    console.warn('Error al guardar usuarios bloqueados en localStorage:', err);
  }
}

