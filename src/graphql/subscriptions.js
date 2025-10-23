/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateUser = /* GraphQL */ `
  subscription OnCreateUser(
    $filter: ModelSubscriptionUserFilterInput
    $owner: String
  ) {
    onCreateUser(filter: $filter, owner: $owner) {
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
      owner
      __typename
    }
  }
`;
export const onUpdateUser = /* GraphQL */ `
  subscription OnUpdateUser(
    $filter: ModelSubscriptionUserFilterInput
    $owner: String
  ) {
    onUpdateUser(filter: $filter, owner: $owner) {
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
      owner
      __typename
    }
  }
`;
export const onDeleteUser = /* GraphQL */ `
  subscription OnDeleteUser(
    $filter: ModelSubscriptionUserFilterInput
    $owner: String
  ) {
    onDeleteUser(filter: $filter, owner: $owner) {
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
      owner
      __typename
    }
  }
`;
export const onCreateConversation = /* GraphQL */ `
  subscription OnCreateConversation(
    $filter: ModelSubscriptionConversationFilterInput
    $biker_id: String
    $photographer_id: String
  ) {
    onCreateConversation(
      filter: $filter
      biker_id: $biker_id
      photographer_id: $photographer_id
    ) {
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
    $biker_id: String
    $photographer_id: String
  ) {
    onUpdateConversation(
      filter: $filter
      biker_id: $biker_id
      photographer_id: $photographer_id
    ) {
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
    $biker_id: String
    $photographer_id: String
  ) {
    onDeleteConversation(
      filter: $filter
      biker_id: $biker_id
      photographer_id: $photographer_id
    ) {
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
  subscription OnCreateMessage(
    $filter: ModelSubscriptionMessageFilterInput
    $sender_id: String
  ) {
    onCreateMessage(filter: $filter, sender_id: $sender_id) {
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
  subscription OnUpdateMessage(
    $filter: ModelSubscriptionMessageFilterInput
    $sender_id: String
  ) {
    onUpdateMessage(filter: $filter, sender_id: $sender_id) {
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
  subscription OnDeleteMessage(
    $filter: ModelSubscriptionMessageFilterInput
    $sender_id: String
  ) {
    onDeleteMessage(filter: $filter, sender_id: $sender_id) {
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
    $photographer_id: String
  ) {
    onCreatePortfolio(filter: $filter, photographer_id: $photographer_id) {
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
    $photographer_id: String
  ) {
    onUpdatePortfolio(filter: $filter, photographer_id: $photographer_id) {
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
    $photographer_id: String
  ) {
    onDeletePortfolio(filter: $filter, photographer_id: $photographer_id) {
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
  subscription OnCreateReview(
    $filter: ModelSubscriptionReviewFilterInput
    $reviewer_id: String
  ) {
    onCreateReview(filter: $filter, reviewer_id: $reviewer_id) {
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
  subscription OnUpdateReview(
    $filter: ModelSubscriptionReviewFilterInput
    $reviewer_id: String
  ) {
    onUpdateReview(filter: $filter, reviewer_id: $reviewer_id) {
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
  subscription OnDeleteReview(
    $filter: ModelSubscriptionReviewFilterInput
    $reviewer_id: String
  ) {
    onDeleteReview(filter: $filter, reviewer_id: $reviewer_id) {
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
