/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateUser = /* GraphQL */ `
  subscription OnCreateUser($filter: ModelSubscriptionUserFilterInput) {
    onCreateUser(filter: $filter) {
      id
      email
      nickname
      user_type
      prefecture
      bike_maker
      bike_model
      shooting_genres
      price_range_min
      price_range_max
      equipment
      bio
      profile_image
      portfolio_website
      instagram_url
      twitter_url
      youtube_url
      special_conditions
      is_accepting_requests
      average_rating
      review_count
      reviewsGiven {
        nextToken
        __typename
      }
      reviewsReceived {
        nextToken
        __typename
      }
      portfolioItems {
        nextToken
        __typename
      }
      conversationsAsBiker {
        nextToken
        __typename
      }
      conversationsAsPhotographer {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateUser = /* GraphQL */ `
  subscription OnUpdateUser($filter: ModelSubscriptionUserFilterInput) {
    onUpdateUser(filter: $filter) {
      id
      email
      nickname
      user_type
      prefecture
      bike_maker
      bike_model
      shooting_genres
      price_range_min
      price_range_max
      equipment
      bio
      profile_image
      portfolio_website
      instagram_url
      twitter_url
      youtube_url
      special_conditions
      is_accepting_requests
      average_rating
      review_count
      reviewsGiven {
        nextToken
        __typename
      }
      reviewsReceived {
        nextToken
        __typename
      }
      portfolioItems {
        nextToken
        __typename
      }
      conversationsAsBiker {
        nextToken
        __typename
      }
      conversationsAsPhotographer {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteUser = /* GraphQL */ `
  subscription OnDeleteUser($filter: ModelSubscriptionUserFilterInput) {
    onDeleteUser(filter: $filter) {
      id
      email
      nickname
      user_type
      prefecture
      bike_maker
      bike_model
      shooting_genres
      price_range_min
      price_range_max
      equipment
      bio
      profile_image
      portfolio_website
      instagram_url
      twitter_url
      youtube_url
      special_conditions
      is_accepting_requests
      average_rating
      review_count
      reviewsGiven {
        nextToken
        __typename
      }
      reviewsReceived {
        nextToken
        __typename
      }
      portfolioItems {
        nextToken
        __typename
      }
      conversationsAsBiker {
        nextToken
        __typename
      }
      conversationsAsPhotographer {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateConversation = /* GraphQL */ `
  subscription OnCreateConversation(
    $filter: ModelSubscriptionConversationFilterInput
  ) {
    onCreateConversation(filter: $filter) {
      id
      biker_id
      photographer_id
      biker_name
      photographer_name
      last_message
      last_message_at
      status
      messages {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateConversation = /* GraphQL */ `
  subscription OnUpdateConversation(
    $filter: ModelSubscriptionConversationFilterInput
  ) {
    onUpdateConversation(filter: $filter) {
      id
      biker_id
      photographer_id
      biker_name
      photographer_name
      last_message
      last_message_at
      status
      messages {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteConversation = /* GraphQL */ `
  subscription OnDeleteConversation(
    $filter: ModelSubscriptionConversationFilterInput
  ) {
    onDeleteConversation(filter: $filter) {
      id
      biker_id
      photographer_id
      biker_name
      photographer_name
      last_message
      last_message_at
      status
      messages {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateMessage = /* GraphQL */ `
  subscription OnCreateMessage($filter: ModelSubscriptionMessageFilterInput) {
    onCreateMessage(filter: $filter) {
      id
      conversationID
      sender_id
      content
      media_key
      media_type
      is_read
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateMessage = /* GraphQL */ `
  subscription OnUpdateMessage($filter: ModelSubscriptionMessageFilterInput) {
    onUpdateMessage(filter: $filter) {
      id
      conversationID
      sender_id
      content
      media_key
      media_type
      is_read
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteMessage = /* GraphQL */ `
  subscription OnDeleteMessage($filter: ModelSubscriptionMessageFilterInput) {
    onDeleteMessage(filter: $filter) {
      id
      conversationID
      sender_id
      content
      media_key
      media_type
      is_read
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreatePortfolio = /* GraphQL */ `
  subscription OnCreatePortfolio(
    $filter: ModelSubscriptionPortfolioFilterInput
  ) {
    onCreatePortfolio(filter: $filter) {
      id
      photographer_id
      image_key
      title
      description
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdatePortfolio = /* GraphQL */ `
  subscription OnUpdatePortfolio(
    $filter: ModelSubscriptionPortfolioFilterInput
  ) {
    onUpdatePortfolio(filter: $filter) {
      id
      photographer_id
      image_key
      title
      description
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeletePortfolio = /* GraphQL */ `
  subscription OnDeletePortfolio(
    $filter: ModelSubscriptionPortfolioFilterInput
  ) {
    onDeletePortfolio(filter: $filter) {
      id
      photographer_id
      image_key
      title
      description
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateReview = /* GraphQL */ `
  subscription OnCreateReview($filter: ModelSubscriptionReviewFilterInput) {
    onCreateReview(filter: $filter) {
      id
      reviewer_id
      reviewee_id
      conversation_id
      rating
      comment
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateReview = /* GraphQL */ `
  subscription OnUpdateReview($filter: ModelSubscriptionReviewFilterInput) {
    onUpdateReview(filter: $filter) {
      id
      reviewer_id
      reviewee_id
      conversation_id
      rating
      comment
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteReview = /* GraphQL */ `
  subscription OnDeleteReview($filter: ModelSubscriptionReviewFilterInput) {
    onDeleteReview(filter: $filter) {
      id
      reviewer_id
      reviewee_id
      conversation_id
      rating
      comment
      createdAt
      updatedAt
      __typename
    }
  }
`;
