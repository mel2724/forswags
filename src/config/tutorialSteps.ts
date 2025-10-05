export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  videoId?: string;
}

export const onboardingTutorialSteps: Record<number, TutorialStep[]> = {
  1: [
    {
      id: 'welcome',
      title: 'Welcome to ForSwags!',
      description: 'Let\'s get your profile set up in just a few steps. Choose your role to get started.',
      targetElement: '[data-tutorial="role-selection"]',
      position: 'bottom',
      videoId: 'intro-video'
    }
  ],
  2: [
    {
      id: 'basic-info',
      title: 'Your Basic Information',
      description: 'This information helps colleges and recruiters find and contact you.',
      targetElement: '[data-tutorial="basic-info-form"]',
      position: 'right',
      videoId: 'profile-basics'
    }
  ],
  3: [
    {
      id: 'sport-details',
      title: 'Sport & Position',
      description: 'Select your primary sport and position. This helps match you with the right opportunities.',
      targetElement: '[data-tutorial="sport-selection"]',
      position: 'right',
      videoId: 'sport-profile'
    }
  ],
  4: [
    {
      id: 'measurements',
      title: 'Physical Stats',
      description: 'Accurate measurements help recruiters assess your fit for their programs.',
      targetElement: '[data-tutorial="measurements-form"]',
      position: 'right',
      videoId: 'physical-stats'
    }
  ],
  5: [
    {
      id: 'academics',
      title: 'Academic Information',
      description: 'Your academic achievements are just as important as your athletic performance.',
      targetElement: '[data-tutorial="academics-form"]',
      position: 'right',
      videoId: 'academics-guide'
    }
  ],
  6: [
    {
      id: 'final-touches',
      title: 'Final Touches',
      description: 'Add highlights and complete your profile to stand out to recruiters.',
      targetElement: '[data-tutorial="highlights-form"]',
      position: 'right',
      videoId: 'profile-completion'
    }
  ]
};

export const videoLibrary: Record<string, { title: string; url: string; duration: string; thumbnail: string }> = {
  'intro-video': {
    title: 'Getting Started with ForSwags',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '2:30',
    thumbnail: '/placeholder.svg'
  },
  'profile-basics': {
    title: 'Creating Your Profile',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '3:15',
    thumbnail: '/placeholder.svg'
  },
  'sport-profile': {
    title: 'Athlete Profile Best Practices',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '4:00',
    thumbnail: '/placeholder.svg'
  },
  'physical-stats': {
    title: 'Recording Accurate Measurements',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '2:45',
    thumbnail: '/placeholder.svg'
  },
  'academics-guide': {
    title: 'Academic Requirements Guide',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '5:20',
    thumbnail: '/placeholder.svg'
  },
  'profile-completion': {
    title: 'Completing Your Profile',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    duration: '3:30',
    thumbnail: '/placeholder.svg'
  }
};
