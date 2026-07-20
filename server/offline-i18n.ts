import type { MagazineEditorial, VideoItem } from './types'
import type { AppLocale } from './openai'
import { localizeLabel } from './i18n'

type VideoCopy = { title: string; description: string; category: string }

const videoCopy: Record<'ko' | 'ja', Record<string, VideoCopy>> = {
  ko: {
    dQw4w9WgXcQ: {
      title: '실리콘밸리의 역설: AI와 인간의 감정',
      description:
        '세계 최고 수준의 AI 모델이 인간 감정의 미묘함을 이해하는 데 왜 어려움을 겪는지, 그리고 합성 미디어의 미래에 어떤 의미가 있는지 살펴봅니다.',
      category: 'AI',
    },
    jNQXAC9IVRw: {
      title: '생성형 창의성의 르네상스',
      description: '생성형 AI 아트와 크리에이티브 워크플로의 추상적 시각화.',
      category: 'Design',
    },
    '9bZkp7q19f0': {
      title: '자동화 럭셔리: 새로운 출퇴근',
      description: '자율 시스템이 승객 경험을 어떻게 재정의하는지.',
      category: 'Technology',
    },
    kJQP7kiw5Fk: {
      title: '실리콘의 한계에 도달했나?',
      description: '무어의 법칙 둔화 속에서 대안 소재를 탐색합니다.',
      category: 'Technology',
    },
    fJ9rUzIMcZQ: {
      title: '합성 음성의 윤리',
      description: '복제된 보이스와 미디어에서의 동의에 관한 에피소드.',
      category: 'AI',
    },
    OPf0YbXqdm0: {
      title: '시장을 바꾸는 지각 알고리즘의 여명',
      description: '독자 AI 모델이 유동성 규칙을 어떻게 다시 쓰는지.',
      category: 'Finance',
    },
  },
  ja: {
    dQw4w9WgXcQ: {
      title: 'シリコンバレーの逆説：AIと人間の感情',
      description:
        '最先端のAIモデルが人間の感情の機微を理解できない理由と、合成メディアの未来への示唆を探ります。',
      category: 'AI',
    },
    jNQXAC9IVRw: {
      title: '生成的創造性のルネサンス',
      description: '生成AIアートとクリエイティブワークフローの抽象ビジュアル。',
      category: 'Design',
    },
    '9bZkp7q19f0': {
      title: '自動化されたラグジュアリー：新しい通勤',
      description: '自律システムが乗客体験をどう再定義するか。',
      category: 'Technology',
    },
    kJQP7kiw5Fk: {
      title: 'シリコンの限界に到達したのか？',
      description: 'ムーアの法則が鈍化する中で代替材料を探る。',
      category: 'Technology',
    },
    fJ9rUzIMcZQ: {
      title: '合成音声の倫理',
      description: 'クローン音声とメディアにおける同意についてのエピソード。',
      category: 'AI',
    },
    OPf0YbXqdm0: {
      title: '市場における知覚アルゴリズムの夜明け',
      description: '独自AIモデルが流動性のルールをどう書き換えるか。',
      category: 'Finance',
    },
  },
}

const channelDesc: Record<'ko' | 'ja', Record<string, string>> = {
  ko: {
    ch1: '딥테크를 대중에게 전하는 크리에이터.',
    ch2: '미니멀 럭셔리와 생성형 UI의 교차점.',
    ch3: '자동화 럭셔리 모빌리티의 미래.',
    ch4: '칩, 소재, 그리고 피지컬 AI.',
    ch6: '시장, 알고리즘, 웰스 테크.',
  },
  ja: {
    ch1: 'ディープテックを大衆に届けるクリエイター。',
    ch2: 'ミニマルラグジュアリーと生成UIの交差点。',
    ch3: '自動化されたラグジュアリーモビリティの未来。',
    ch4: 'チップ、素材、そしてフィジカルAI。',
    ch6: '市場、アルゴリズム、ウェルスTech。',
  },
}

export function applyOfflineVideoLocale(
  videos: VideoItem[],
  locale: AppLocale,
): VideoItem[] {
  if (locale === 'en') return videos
  const pack = videoCopy[locale]
  return videos.map((v) => {
    const hit = pack[v.id]
    if (hit) {
      return {
        ...v,
        title: hit.title,
        description: hit.description,
        category: localizeLabel(hit.category, locale),
      }
    }
    return {
      ...v,
      category: localizeLabel(v.category, locale),
    }
  })
}

export function applyOfflineStringLocale(
  items: { id: string; text: string }[],
  locale: AppLocale,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const i of items) {
    if (locale !== 'en' && channelDesc[locale][i.id]) {
      out[i.id] = channelDesc[locale][i.id]
    } else {
      out[i.id] = i.text
    }
  }
  return out
}

export function offlineBrief(
  videos: VideoItem[],
  locale: AppLocale,
): {
  headline: string
  dek: string
  notes: string[]
  sentiment: number
  velocity: number
} {
  const cover = videos[0]
  const title = cover?.title ?? ''
  if (locale === 'ko') {
    return {
      headline: title || '오늘의 AI 브리프',
      dek: '오늘 기술 문화를 움직이는 영상을 큐레이션한 데일리 다이제스트입니다.',
      notes: videos.slice(0, 3).map(
        (v) =>
          `${v.channelTitle}: ${v.title} (조회 ${v.viewCount.toLocaleString()}회)`,
      ),
      sentiment: 84,
      velocity: 92,
    }
  }
  if (locale === 'ja') {
    return {
      headline: title || '本日のAIブリーフ',
      dek: '今日のテック文化を形づくる動画を厳選したデイリーダイジェストです。',
      notes: videos.slice(0, 3).map(
        (v) =>
          `${v.channelTitle}: ${v.title}（再生 ${v.viewCount.toLocaleString()}回）`,
      ),
      sentiment: 84,
      velocity: 92,
    }
  }
  return {
    headline: title || "Today's AI Brief",
    dek: 'A curated digest of the videos shaping technology culture today.',
    notes: videos.slice(0, 3).map(
      (v) =>
        `${v.channelTitle}: ${v.title} (${v.viewCount.toLocaleString()} views)`,
    ),
    sentiment: 84,
    velocity: 92,
  }
}

export function offlineEditorial(
  video: VideoItem,
  locale: AppLocale,
): MagazineEditorial {
  const cat = localizeLabel(video.category, locale)
  if (locale === 'ko') {
    return {
      headline: video.title.replace(/\.$/, ''),
      dek: `${video.channelTitle}의 주목 영상에 대한 AI 큐레이션 분석.`,
      category: cat,
      summary: [
        `${video.channelTitle}의 영상이 조회수 ${video.viewCount.toLocaleString()}회로 화제를 모으고 있습니다.`,
        '기술 주제를 데모가 아닌 에디토리얼 내러티브로 재구성합니다.',
        '크리에이터와 운영자는 2차적 문화 파급 효과에 주목해야 합니다.',
      ],
      whyItMatters: `단순 조회수 추격이 아니라, 이 영상은 독자가 ${video.category ?? '기술'}을 이해하는 방식을 바꿉니다. 핵심은 프레이밍입니다: ${video.title}`,
      keyInsights: [
        '강한 내러티브 아크가 기능 나열을 이깁니다.',
        '썸네일과 제목은 클릭베이트가 아니라 매거진 커버처럼 작동합니다.',
        '참여 품질은 전문가·파운더 오디언스를 시사합니다.',
        '크리에이터는 과장보다 실용적 설명을 택합니다.',
      ],
      trends: [
        `${video.category ?? 'AI'} 해설이 메인스트림 매거진 콘텐츠로 이동`,
        '유튜브 롱폼에 에디토리얼 페이싱이 유입',
      ],
      similarVideos: ['같은 니치의 관련 심층 분석'],
      watchNext: ['크리에이터 스포트라이트 후속편'],
      creatorStyle: `${video.channelTitle}은(는) 권위 있는 톤으로 시각적 설명을 명확히 합니다.`,
      audience: '파운더, 개발자, 디자이너, 호기심 많은 전문가.',
      keyQuotes: [
        '우리는 더 이상 화면을 디자인하는 게 아니라, 행동을 디자인한다.',
      ],
      aiOpinion:
        '매거진 취급을 받을 만한 고품질 에디토리얼 — 훑어보기보다 정독할 가치가 있습니다.',
      relatedNews: `${video.category ?? 'AI'} 제품화와 문화를 둘러싼 진행 중인 대화.`,
      qualityScore: {
        originality: 82,
        educationalValue: 88,
        entertainment: 74,
        productionQuality: 86,
        thumbnail: 80,
        title: 84,
        seo: 78,
        storytelling: 90,
        total: 83,
      },
      bodySections: [
        {
          id: 'intro',
          title: '이 영상이 중요한 이유',
          content:
            video.description?.slice(0, 600) ||
            '이 공개작은 플랫폼 지표와 에디토리얼 공교의 교차점에 있습니다.',
        },
        {
          id: 'insights',
          title: '핵심 인사이트',
          content:
            '가장 강한 신호는 단순 바이럴이 아니라, 복잡성을 세련된 독자가 끝까지 읽을 이야기로 얼마나 깔끔하게 번역하느냐입니다.',
        },
        {
          id: 'audience',
          title: '누구를 위한 영상인가',
          content:
            '툴을 평가하는 운영자, 내러티브를 연구하는 크리에이터, 문화적 채택 곡선을 추적하는 투자자.',
        },
        {
          id: 'conclusion',
          title: '에디터의 마무리',
          content:
            '커버 스토리처럼 다루세요. 한 번은 공교를, 한 번은 전략을 위해 다시 보세요.',
        },
      ],
    }
  }

  if (locale === 'ja') {
    return {
      headline: video.title.replace(/\.$/, ''),
      dek: `${video.channelTitle}の注目動画に関するAIキュレーション分析。`,
      category: cat,
      summary: [
        `${video.channelTitle}の動画が再生回数 ${video.viewCount.toLocaleString()} で話題になっています。`,
        '技術トピックをデモではなくエディトリアルな物語として再構成します。',
        'クリエイターと運営者は二次的な文化的インパクトに注目すべきです。',
      ],
      whyItMatters: `単なる再生数追いではなく、この動画は読者が${video.category ?? 'テクノロジー'}を理解する仕方を変えます。要点はフレーミングです：${video.title}`,
      keyInsights: [
        '強いナラティブアークは機能リストに勝ります。',
        'サムネとタイトルはクリックベイトではなく雑誌の表紙として機能します。',
        'エンゲージメント品質はプロ／創業者オーディエンスを示唆します。',
        'クリエイターは誇張より実践的な説明を選びます。',
      ],
      trends: [
        `${video.category ?? 'AI'}解説がメインストリーム雑誌コンテンツへ`,
        'YouTube長尺へのエディトリアル・ペーシング流入',
      ],
      similarVideos: ['同ニッチの関連深掘り'],
      watchNext: ['クリエイタースポットライト続編'],
      creatorStyle: `${video.channelTitle}は権威あるトーンで視覚的な説明を明確にします。`,
      audience: '創業者、開発者、デザイナー、好奇心旺盛な専門家。',
      keyQuotes: [
        '私たちはもはや画面をデザインしているのではなく、行動をデザインしている。',
      ],
      aiOpinion:
        '雑誌扱いに値する高品質エディトリアル — 流し読みではなく熟読の価値があります。',
      relatedNews: `${video.category ?? 'AI'}のプロダクト化と文化をめぐる進行中の議論。`,
      qualityScore: {
        originality: 82,
        educationalValue: 88,
        entertainment: 74,
        productionQuality: 86,
        thumbnail: 80,
        title: 84,
        seo: 78,
        storytelling: 90,
        total: 83,
      },
      bodySections: [
        {
          id: 'intro',
          title: 'この動画が重要な理由',
          content:
            video.description?.slice(0, 600) ||
            'この公開はプラットフォーム指標とエディトリアルの技の交差点にあります。',
        },
        {
          id: 'insights',
          title: 'キーインサイト',
          content:
            '最も強いシグナルは生のバイラル性ではなく、複雑さを洗練された読者が読み切る物語へどれだけきれいに翻訳するかです。',
        },
        {
          id: 'audience',
          title: '誰が見るべきか',
          content:
            'ツールを評価する運営者、ナラティブを研究するクリエイター、文化的採用曲線を追う投資家。',
        },
        {
          id: 'conclusion',
          title: '編集者の締め',
          content:
            'カバーストーリーとして扱いましょう。一度は技のために、もう一度は戦略のために。',
        },
      ],
    }
  }

  // English fallback — reuse structure from openai mockEditorial caller
  return {
    headline: video.title.replace(/\.$/, ''),
    dek: `AI-curated analysis of ${video.channelTitle}'s standout video.`,
    category: cat,
    summary: [
      `${video.channelTitle} released a high-signal video now at ${video.viewCount.toLocaleString()} views.`,
      'The piece reframes a technical topic as an editorial narrative rather than a demo reel.',
      'Creators and operators should watch for the second-order cultural impact.',
    ],
    whyItMatters: `Instead of merely chasing views, this video changes how audiences understand ${video.category ?? 'technology'}. The craft is in the framing: ${video.title}`,
    keyInsights: [
      'Strong narrative arc beats feature laundry lists.',
      'Thumbnail and title work as a magazine cover, not clickbait.',
      'Engagement quality suggests a professional / founder audience.',
      'The creator leans into practical explanation over hype.',
    ],
    trends: [
      `${video.category ?? 'AI'} explainers becoming mainstream magazine content`,
      'Editorial pacing entering YouTube long-form',
    ],
    similarVideos: ['Related deep dives in the same niche'],
    watchNext: ['Creator spotlight follow-ups'],
    creatorStyle: `${video.channelTitle} focuses on clear visual explanation with authoritative tone.`,
    audience: 'Founders, developers, designers, and curious professionals.',
    keyQuotes: [
      'We are no longer designing screens; we are designing behaviors.',
    ],
    aiOpinion:
      'A high-quality editorial piece that earns magazine treatment — worth a full read, not a skim.',
    relatedNews: `Ongoing conversation around ${video.category ?? 'AI'} productization and culture.`,
    qualityScore: {
      originality: 82,
      educationalValue: 88,
      entertainment: 74,
      productionQuality: 86,
      thumbnail: 80,
      title: 84,
      seo: 78,
      storytelling: 90,
      total: 83,
    },
    bodySections: [
      {
        id: 'intro',
        title: 'Why This Video Matters',
        content:
          video.description?.slice(0, 600) ||
          'This release sits at the intersection of platform metrics and editorial craft.',
      },
      {
        id: 'insights',
        title: 'Key Insights',
        content:
          'The strongest signal is not raw virality — it is how cleanly the creator translates complexity into a story a sophisticated reader would finish.',
      },
      {
        id: 'audience',
        title: 'Who Should Watch',
        content:
          'Operators evaluating tools, creators studying narrative, and investors tracking cultural adoption curves.',
      },
      {
        id: 'conclusion',
        title: "Editor's Close",
        content:
          'Treat this as a cover story: watch once for craft, again for strategy.',
      },
    ],
  }
}
