/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import {
  Badge,
  Button,
  Divider,
  Flex,
  Grid,
  Icon,
  ScrollView,
  SelectField,
  SwitchField,
  Text,
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { generateClient } from "aws-amplify/api";
import { createUser } from "../graphql/mutations";
const client = generateClient();
function ArrayField({
  items = [],
  onChange,
  label,
  inputFieldRef,
  children,
  hasError,
  setFieldValue,
  currentFieldValue,
  defaultFieldValue,
  lengthLimit,
  getBadgeText,
  runValidationTasks,
  errorMessage,
}) {
  const labelElement = <Text>{label}</Text>;
  const {
    tokens: {
      components: {
        fieldmessages: { error: errorStyles },
      },
    },
  } = useTheme();
  const [selectedBadgeIndex, setSelectedBadgeIndex] = React.useState();
  const [isEditing, setIsEditing] = React.useState();
  React.useEffect(() => {
    if (isEditing) {
      inputFieldRef?.current?.focus();
    }
  }, [isEditing]);
  const removeItem = async (removeIndex) => {
    const newItems = items.filter((value, index) => index !== removeIndex);
    await onChange(newItems);
    setSelectedBadgeIndex(undefined);
  };
  const addItem = async () => {
    const { hasError } = runValidationTasks();
    if (
      currentFieldValue !== undefined &&
      currentFieldValue !== null &&
      currentFieldValue !== "" &&
      !hasError
    ) {
      const newItems = [...items];
      if (selectedBadgeIndex !== undefined) {
        newItems[selectedBadgeIndex] = currentFieldValue;
        setSelectedBadgeIndex(undefined);
      } else {
        newItems.push(currentFieldValue);
      }
      await onChange(newItems);
      setIsEditing(false);
    }
  };
  const arraySection = (
    <React.Fragment>
      {!!items?.length && (
        <ScrollView height="inherit" width="inherit" maxHeight={"7rem"}>
          {items.map((value, index) => {
            return (
              <Badge
                key={index}
                style={{
                  cursor: "pointer",
                  alignItems: "center",
                  marginRight: 3,
                  marginTop: 3,
                  backgroundColor:
                    index === selectedBadgeIndex ? "#B8CEF9" : "",
                }}
                onClick={() => {
                  setSelectedBadgeIndex(index);
                  setFieldValue(items[index]);
                  setIsEditing(true);
                }}
              >
                {getBadgeText ? getBadgeText(value) : value.toString()}
                <Icon
                  style={{
                    cursor: "pointer",
                    paddingLeft: 3,
                    width: 20,
                    height: 20,
                  }}
                  viewBox={{ width: 20, height: 20 }}
                  paths={[
                    {
                      d: "M10 10l5.09-5.09L10 10l5.09 5.09L10 10zm0 0L4.91 4.91 10 10l-5.09 5.09L10 10z",
                      stroke: "black",
                    },
                  ]}
                  ariaLabel="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeItem(index);
                  }}
                />
              </Badge>
            );
          })}
        </ScrollView>
      )}
      <Divider orientation="horizontal" marginTop={5} />
    </React.Fragment>
  );
  if (lengthLimit !== undefined && items.length >= lengthLimit && !isEditing) {
    return (
      <React.Fragment>
        {labelElement}
        {arraySection}
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      {labelElement}
      {isEditing && children}
      {!isEditing ? (
        <>
          <Button
            onClick={() => {
              setIsEditing(true);
            }}
          >
            Add item
          </Button>
          {errorMessage && hasError && (
            <Text color={errorStyles.color} fontSize={errorStyles.fontSize}>
              {errorMessage}
            </Text>
          )}
        </>
      ) : (
        <Flex justifyContent="flex-end">
          {(currentFieldValue || isEditing) && (
            <Button
              children="Cancel"
              type="button"
              size="small"
              onClick={() => {
                setFieldValue(defaultFieldValue);
                setIsEditing(false);
                setSelectedBadgeIndex(undefined);
              }}
            ></Button>
          )}
          <Button size="small" variation="link" onClick={addItem}>
            {selectedBadgeIndex !== undefined ? "Save" : "Add"}
          </Button>
        </Flex>
      )}
      {arraySection}
    </React.Fragment>
  );
}
export default function UserCreateForm(props) {
  const {
    clearOnSuccess = true,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    email: "",
    nickname: "",
    user_type: "",
    prefecture: "",
    bike_maker: "",
    bike_model: "",
    shooting_genres: [],
    price_range_min: "",
    price_range_max: "",
    equipment: "",
    bio: "",
    profile_image: "",
    portfolio_website: "",
    instagram_url: "",
    twitter_url: "",
    youtube_url: "",
    special_conditions: [],
    is_accepting_requests: false,
    average_rating: "",
    review_count: "",
  };
  const [email, setEmail] = React.useState(initialValues.email);
  const [nickname, setNickname] = React.useState(initialValues.nickname);
  const [user_type, setUser_type] = React.useState(initialValues.user_type);
  const [prefecture, setPrefecture] = React.useState(initialValues.prefecture);
  const [bike_maker, setBike_maker] = React.useState(initialValues.bike_maker);
  const [bike_model, setBike_model] = React.useState(initialValues.bike_model);
  const [shooting_genres, setShooting_genres] = React.useState(
    initialValues.shooting_genres
  );
  const [price_range_min, setPrice_range_min] = React.useState(
    initialValues.price_range_min
  );
  const [price_range_max, setPrice_range_max] = React.useState(
    initialValues.price_range_max
  );
  const [equipment, setEquipment] = React.useState(initialValues.equipment);
  const [bio, setBio] = React.useState(initialValues.bio);
  const [profile_image, setProfile_image] = React.useState(
    initialValues.profile_image
  );
  const [portfolio_website, setPortfolio_website] = React.useState(
    initialValues.portfolio_website
  );
  const [instagram_url, setInstagram_url] = React.useState(
    initialValues.instagram_url
  );
  const [twitter_url, setTwitter_url] = React.useState(
    initialValues.twitter_url
  );
  const [youtube_url, setYoutube_url] = React.useState(
    initialValues.youtube_url
  );
  const [special_conditions, setSpecial_conditions] = React.useState(
    initialValues.special_conditions
  );
  const [is_accepting_requests, setIs_accepting_requests] = React.useState(
    initialValues.is_accepting_requests
  );
  const [average_rating, setAverage_rating] = React.useState(
    initialValues.average_rating
  );
  const [review_count, setReview_count] = React.useState(
    initialValues.review_count
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setEmail(initialValues.email);
    setNickname(initialValues.nickname);
    setUser_type(initialValues.user_type);
    setPrefecture(initialValues.prefecture);
    setBike_maker(initialValues.bike_maker);
    setBike_model(initialValues.bike_model);
    setShooting_genres(initialValues.shooting_genres);
    setCurrentShooting_genresValue("");
    setPrice_range_min(initialValues.price_range_min);
    setPrice_range_max(initialValues.price_range_max);
    setEquipment(initialValues.equipment);
    setBio(initialValues.bio);
    setProfile_image(initialValues.profile_image);
    setPortfolio_website(initialValues.portfolio_website);
    setInstagram_url(initialValues.instagram_url);
    setTwitter_url(initialValues.twitter_url);
    setYoutube_url(initialValues.youtube_url);
    setSpecial_conditions(initialValues.special_conditions);
    setCurrentSpecial_conditionsValue("");
    setIs_accepting_requests(initialValues.is_accepting_requests);
    setAverage_rating(initialValues.average_rating);
    setReview_count(initialValues.review_count);
    setErrors({});
  };
  const [currentShooting_genresValue, setCurrentShooting_genresValue] =
    React.useState("");
  const shooting_genresRef = React.createRef();
  const [currentSpecial_conditionsValue, setCurrentSpecial_conditionsValue] =
    React.useState("");
  const special_conditionsRef = React.createRef();
  const validations = {
    email: [{ type: "Required" }],
    nickname: [],
    user_type: [],
    prefecture: [],
    bike_maker: [],
    bike_model: [],
    shooting_genres: [],
    price_range_min: [],
    price_range_max: [],
    equipment: [],
    bio: [],
    profile_image: [],
    portfolio_website: [],
    instagram_url: [],
    twitter_url: [],
    youtube_url: [],
    special_conditions: [],
    is_accepting_requests: [],
    average_rating: [],
    review_count: [],
  };
  const runValidationTasks = async (
    fieldName,
    currentValue,
    getDisplayValue
  ) => {
    const value =
      currentValue && getDisplayValue
        ? getDisplayValue(currentValue)
        : currentValue;
    let validationResponse = validateField(value, validations[fieldName]);
    const customValidator = fetchByPath(onValidate, fieldName);
    if (customValidator) {
      validationResponse = await customValidator(value, validationResponse);
    }
    setErrors((errors) => ({ ...errors, [fieldName]: validationResponse }));
    return validationResponse;
  };
  return (
    <Grid
      as="form"
      rowGap="15px"
      columnGap="15px"
      padding="20px"
      onSubmit={async (event) => {
        event.preventDefault();
        let modelFields = {
          email,
          nickname,
          user_type,
          prefecture,
          bike_maker,
          bike_model,
          shooting_genres,
          price_range_min,
          price_range_max,
          equipment,
          bio,
          profile_image,
          portfolio_website,
          instagram_url,
          twitter_url,
          youtube_url,
          special_conditions,
          is_accepting_requests,
          average_rating,
          review_count,
        };
        const validationResponses = await Promise.all(
          Object.keys(validations).reduce((promises, fieldName) => {
            if (Array.isArray(modelFields[fieldName])) {
              promises.push(
                ...modelFields[fieldName].map((item) =>
                  runValidationTasks(fieldName, item)
                )
              );
              return promises;
            }
            promises.push(
              runValidationTasks(fieldName, modelFields[fieldName])
            );
            return promises;
          }, [])
        );
        if (validationResponses.some((r) => r.hasError)) {
          return;
        }
        if (onSubmit) {
          modelFields = onSubmit(modelFields);
        }
        try {
          Object.entries(modelFields).forEach(([key, value]) => {
            if (typeof value === "string" && value === "") {
              modelFields[key] = null;
            }
          });
          await client.graphql({
            query: createUser.replaceAll("__typename", ""),
            variables: {
              input: {
                ...modelFields,
              },
            },
          });
          if (onSuccess) {
            onSuccess(modelFields);
          }
          if (clearOnSuccess) {
            resetStateValues();
          }
        } catch (err) {
          if (onError) {
            const messages = err.errors.map((e) => e.message).join("\n");
            onError(modelFields, messages);
          }
        }
      }}
      {...getOverrideProps(overrides, "UserCreateForm")}
      {...rest}
    >
      <TextField
        label="Email"
        isRequired={true}
        isReadOnly={false}
        value={email}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              email: value,
              nickname,
              user_type,
              prefecture,
              bike_maker,
              bike_model,
              shooting_genres,
              price_range_min,
              price_range_max,
              equipment,
              bio,
              profile_image,
              portfolio_website,
              instagram_url,
              twitter_url,
              youtube_url,
              special_conditions,
              is_accepting_requests,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            value = result?.email ?? value;
          }
          if (errors.email?.hasError) {
            runValidationTasks("email", value);
          }
          setEmail(value);
        }}
        onBlur={() => runValidationTasks("email", email)}
        errorMessage={errors.email?.errorMessage}
        hasError={errors.email?.hasError}
        {...getOverrideProps(overrides, "email")}
      ></TextField>
      <TextField
        label="Nickname"
        isRequired={false}
        isReadOnly={false}
        value={nickname}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              email,
              nickname: value,
              user_type,
              prefecture,
              bike_maker,
              bike_model,
              shooting_genres,
              price_range_min,
              price_range_max,
              equipment,
              bio,
              profile_image,
              portfolio_website,
              instagram_url,
              twitter_url,
              youtube_url,
              special_conditions,
              is_accepting_requests,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            value = result?.nickname ?? value;
          }
          if (errors.nickname?.hasError) {
            runValidationTasks("nickname", value);
          }
          setNickname(value);
        }}
        onBlur={() => runValidationTasks("nickname", nickname)}
        errorMessage={errors.nickname?.errorMessage}
        hasError={errors.nickname?.hasError}
        {...getOverrideProps(overrides, "nickname")}
      ></TextField>
      <SelectField
        label="User type"
        placeholder="Please select an option"
        isDisabled={false}
        value={user_type}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type: value,
              prefecture,
              bike_maker,
              bike_model,
              shooting_genres,
              price_range_min,
              price_range_max,
              equipment,
              bio,
              profile_image,
              portfolio_website,
              instagram_url,
              twitter_url,
              youtube_url,
              special_conditions,
              is_accepting_requests,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            value = result?.user_type ?? value;
          }
          if (errors.user_type?.hasError) {
            runValidationTasks("user_type", value);
          }
          setUser_type(value);
        }}
        onBlur={() => runValidationTasks("user_type", user_type)}
        errorMessage={errors.user_type?.errorMessage}
        hasError={errors.user_type?.hasError}
        {...getOverrideProps(overrides, "user_type")}
      >
        <option
          children="Rider"
          value="rider"
          {...getOverrideProps(overrides, "user_typeoption0")}
        ></option>
        <option
          children="Photographer"
          value="photographer"
          {...getOverrideProps(overrides, "user_typeoption1")}
        ></option>
      </SelectField>
      <TextField
        label="Prefecture"
        isRequired={false}
        isReadOnly={false}
        value={prefecture}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type,
              prefecture: value,
              bike_maker,
              bike_model,
              shooting_genres,
              price_range_min,
              price_range_max,
              equipment,
              bio,
              profile_image,
              portfolio_website,
              instagram_url,
              twitter_url,
              youtube_url,
              special_conditions,
              is_accepting_requests,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            value = result?.prefecture ?? value;
          }
          if (errors.prefecture?.hasError) {
            runValidationTasks("prefecture", value);
          }
          setPrefecture(value);
        }}
        onBlur={() => runValidationTasks("prefecture", prefecture)}
        errorMessage={errors.prefecture?.errorMessage}
        hasError={errors.prefecture?.hasError}
        {...getOverrideProps(overrides, "prefecture")}
      ></TextField>
      <TextField
        label="Bike maker"
        isRequired={false}
        isReadOnly={false}
        value={bike_maker}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type,
              prefecture,
              bike_maker: value,
              bike_model,
              shooting_genres,
              price_range_min,
              price_range_max,
              equipment,
              bio,
              profile_image,
              portfolio_website,
              instagram_url,
              twitter_url,
              youtube_url,
              special_conditions,
              is_accepting_requests,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            value = result?.bike_maker ?? value;
          }
          if (errors.bike_maker?.hasError) {
            runValidationTasks("bike_maker", value);
          }
          setBike_maker(value);
        }}
        onBlur={() => runValidationTasks("bike_maker", bike_maker)}
        errorMessage={errors.bike_maker?.errorMessage}
        hasError={errors.bike_maker?.hasError}
        {...getOverrideProps(overrides, "bike_maker")}
      ></TextField>
      <TextField
        label="Bike model"
        isRequired={false}
        isReadOnly={false}
        value={bike_model}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type,
              prefecture,
              bike_maker,
              bike_model: value,
              shooting_genres,
              price_range_min,
              price_range_max,
              equipment,
              bio,
              profile_image,
              portfolio_website,
              instagram_url,
              twitter_url,
              youtube_url,
              special_conditions,
              is_accepting_requests,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            value = result?.bike_model ?? value;
          }
          if (errors.bike_model?.hasError) {
            runValidationTasks("bike_model", value);
          }
          setBike_model(value);
        }}
        onBlur={() => runValidationTasks("bike_model", bike_model)}
        errorMessage={errors.bike_model?.errorMessage}
        hasError={errors.bike_model?.hasError}
        {...getOverrideProps(overrides, "bike_model")}
      ></TextField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type,
              prefecture,
              bike_maker,
              bike_model,
              shooting_genres: values,
              price_range_min,
              price_range_max,
              equipment,
              bio,
              profile_image,
              portfolio_website,
              instagram_url,
              twitter_url,
              youtube_url,
              special_conditions,
              is_accepting_requests,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            values = result?.shooting_genres ?? values;
          }
          setShooting_genres(values);
          setCurrentShooting_genresValue("");
        }}
        currentFieldValue={currentShooting_genresValue}
        label={"Shooting genres"}
        items={shooting_genres}
        hasError={errors?.shooting_genres?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks(
            "shooting_genres",
            currentShooting_genresValue
          )
        }
        errorMessage={errors?.shooting_genres?.errorMessage}
        setFieldValue={setCurrentShooting_genresValue}
        inputFieldRef={shooting_genresRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Shooting genres"
          isRequired={false}
          isReadOnly={false}
          value={currentShooting_genresValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.shooting_genres?.hasError) {
              runValidationTasks("shooting_genres", value);
            }
            setCurrentShooting_genresValue(value);
          }}
          onBlur={() =>
            runValidationTasks("shooting_genres", currentShooting_genresValue)
          }
          errorMessage={errors.shooting_genres?.errorMessage}
          hasError={errors.shooting_genres?.hasError}
          ref={shooting_genresRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "shooting_genres")}
        ></TextField>
      </ArrayField>
      <TextField
        label="Price range min"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={price_range_min}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type,
              prefecture,
              bike_maker,
              bike_model,
              shooting_genres,
              price_range_min: value,
              price_range_max,
              equipment,
              bio,
              profile_image,
              portfolio_website,
              instagram_url,
              twitter_url,
              youtube_url,
              special_conditions,
              is_accepting_requests,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            value = result?.price_range_min ?? value;
          }
          if (errors.price_range_min?.hasError) {
            runValidationTasks("price_range_min", value);
          }
          setPrice_range_min(value);
        }}
        onBlur={() => runValidationTasks("price_range_min", price_range_min)}
        errorMessage={errors.price_range_min?.errorMessage}
        hasError={errors.price_range_min?.hasError}
        {...getOverrideProps(overrides, "price_range_min")}
      ></TextField>
      <TextField
        label="Price range max"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={price_range_max}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type,
              prefecture,
              bike_maker,
              bike_model,
              shooting_genres,
              price_range_min,
              price_range_max: value,
              equipment,
              bio,
              profile_image,
              portfolio_website,
              instagram_url,
              twitter_url,
              youtube_url,
              special_conditions,
              is_accepting_requests,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            value = result?.price_range_max ?? value;
          }
          if (errors.price_range_max?.hasError) {
            runValidationTasks("price_range_max", value);
          }
          setPrice_range_max(value);
        }}
        onBlur={() => runValidationTasks("price_range_max", price_range_max)}
        errorMessage={errors.price_range_max?.errorMessage}
        hasError={errors.price_range_max?.hasError}
        {...getOverrideProps(overrides, "price_range_max")}
      ></TextField>
      <TextField
        label="Equipment"
        isRequired={false}
        isReadOnly={false}
        value={equipment}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type,
              prefecture,
              bike_maker,
              bike_model,
              shooting_genres,
              price_range_min,
              price_range_max,
              equipment: value,
              bio,
              profile_image,
              portfolio_website,
              instagram_url,
              twitter_url,
              youtube_url,
              special_conditions,
              is_accepting_requests,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            value = result?.equipment ?? value;
          }
          if (errors.equipment?.hasError) {
            runValidationTasks("equipment", value);
          }
          setEquipment(value);
        }}
        onBlur={() => runValidationTasks("equipment", equipment)}
        errorMessage={errors.equipment?.errorMessage}
        hasError={errors.equipment?.hasError}
        {...getOverrideProps(overrides, "equipment")}
      ></TextField>
      <TextField
        label="Bio"
        isRequired={false}
        isReadOnly={false}
        value={bio}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type,
              prefecture,
              bike_maker,
              bike_model,
              shooting_genres,
              price_range_min,
              price_range_max,
              equipment,
              bio: value,
              profile_image,
              portfolio_website,
              instagram_url,
              twitter_url,
              youtube_url,
              special_conditions,
              is_accepting_requests,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            value = result?.bio ?? value;
          }
          if (errors.bio?.hasError) {
            runValidationTasks("bio", value);
          }
          setBio(value);
        }}
        onBlur={() => runValidationTasks("bio", bio)}
        errorMessage={errors.bio?.errorMessage}
        hasError={errors.bio?.hasError}
        {...getOverrideProps(overrides, "bio")}
      ></TextField>
      <TextField
        label="Profile image"
        isRequired={false}
        isReadOnly={false}
        value={profile_image}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type,
              prefecture,
              bike_maker,
              bike_model,
              shooting_genres,
              price_range_min,
              price_range_max,
              equipment,
              bio,
              profile_image: value,
              portfolio_website,
              instagram_url,
              twitter_url,
              youtube_url,
              special_conditions,
              is_accepting_requests,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            value = result?.profile_image ?? value;
          }
          if (errors.profile_image?.hasError) {
            runValidationTasks("profile_image", value);
          }
          setProfile_image(value);
        }}
        onBlur={() => runValidationTasks("profile_image", profile_image)}
        errorMessage={errors.profile_image?.errorMessage}
        hasError={errors.profile_image?.hasError}
        {...getOverrideProps(overrides, "profile_image")}
      ></TextField>
      <TextField
        label="Portfolio website"
        isRequired={false}
        isReadOnly={false}
        value={portfolio_website}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type,
              prefecture,
              bike_maker,
              bike_model,
              shooting_genres,
              price_range_min,
              price_range_max,
              equipment,
              bio,
              profile_image,
              portfolio_website: value,
              instagram_url,
              twitter_url,
              youtube_url,
              special_conditions,
              is_accepting_requests,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            value = result?.portfolio_website ?? value;
          }
          if (errors.portfolio_website?.hasError) {
            runValidationTasks("portfolio_website", value);
          }
          setPortfolio_website(value);
        }}
        onBlur={() =>
          runValidationTasks("portfolio_website", portfolio_website)
        }
        errorMessage={errors.portfolio_website?.errorMessage}
        hasError={errors.portfolio_website?.hasError}
        {...getOverrideProps(overrides, "portfolio_website")}
      ></TextField>
      <TextField
        label="Instagram url"
        isRequired={false}
        isReadOnly={false}
        value={instagram_url}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type,
              prefecture,
              bike_maker,
              bike_model,
              shooting_genres,
              price_range_min,
              price_range_max,
              equipment,
              bio,
              profile_image,
              portfolio_website,
              instagram_url: value,
              twitter_url,
              youtube_url,
              special_conditions,
              is_accepting_requests,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            value = result?.instagram_url ?? value;
          }
          if (errors.instagram_url?.hasError) {
            runValidationTasks("instagram_url", value);
          }
          setInstagram_url(value);
        }}
        onBlur={() => runValidationTasks("instagram_url", instagram_url)}
        errorMessage={errors.instagram_url?.errorMessage}
        hasError={errors.instagram_url?.hasError}
        {...getOverrideProps(overrides, "instagram_url")}
      ></TextField>
      <TextField
        label="Twitter url"
        isRequired={false}
        isReadOnly={false}
        value={twitter_url}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type,
              prefecture,
              bike_maker,
              bike_model,
              shooting_genres,
              price_range_min,
              price_range_max,
              equipment,
              bio,
              profile_image,
              portfolio_website,
              instagram_url,
              twitter_url: value,
              youtube_url,
              special_conditions,
              is_accepting_requests,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            value = result?.twitter_url ?? value;
          }
          if (errors.twitter_url?.hasError) {
            runValidationTasks("twitter_url", value);
          }
          setTwitter_url(value);
        }}
        onBlur={() => runValidationTasks("twitter_url", twitter_url)}
        errorMessage={errors.twitter_url?.errorMessage}
        hasError={errors.twitter_url?.hasError}
        {...getOverrideProps(overrides, "twitter_url")}
      ></TextField>
      <TextField
        label="Youtube url"
        isRequired={false}
        isReadOnly={false}
        value={youtube_url}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type,
              prefecture,
              bike_maker,
              bike_model,
              shooting_genres,
              price_range_min,
              price_range_max,
              equipment,
              bio,
              profile_image,
              portfolio_website,
              instagram_url,
              twitter_url,
              youtube_url: value,
              special_conditions,
              is_accepting_requests,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            value = result?.youtube_url ?? value;
          }
          if (errors.youtube_url?.hasError) {
            runValidationTasks("youtube_url", value);
          }
          setYoutube_url(value);
        }}
        onBlur={() => runValidationTasks("youtube_url", youtube_url)}
        errorMessage={errors.youtube_url?.errorMessage}
        hasError={errors.youtube_url?.hasError}
        {...getOverrideProps(overrides, "youtube_url")}
      ></TextField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type,
              prefecture,
              bike_maker,
              bike_model,
              shooting_genres,
              price_range_min,
              price_range_max,
              equipment,
              bio,
              profile_image,
              portfolio_website,
              instagram_url,
              twitter_url,
              youtube_url,
              special_conditions: values,
              is_accepting_requests,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            values = result?.special_conditions ?? values;
          }
          setSpecial_conditions(values);
          setCurrentSpecial_conditionsValue("");
        }}
        currentFieldValue={currentSpecial_conditionsValue}
        label={"Special conditions"}
        items={special_conditions}
        hasError={errors?.special_conditions?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks(
            "special_conditions",
            currentSpecial_conditionsValue
          )
        }
        errorMessage={errors?.special_conditions?.errorMessage}
        setFieldValue={setCurrentSpecial_conditionsValue}
        inputFieldRef={special_conditionsRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Special conditions"
          isRequired={false}
          isReadOnly={false}
          value={currentSpecial_conditionsValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.special_conditions?.hasError) {
              runValidationTasks("special_conditions", value);
            }
            setCurrentSpecial_conditionsValue(value);
          }}
          onBlur={() =>
            runValidationTasks(
              "special_conditions",
              currentSpecial_conditionsValue
            )
          }
          errorMessage={errors.special_conditions?.errorMessage}
          hasError={errors.special_conditions?.hasError}
          ref={special_conditionsRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "special_conditions")}
        ></TextField>
      </ArrayField>
      <SwitchField
        label="Is accepting requests"
        defaultChecked={false}
        isDisabled={false}
        isChecked={is_accepting_requests}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type,
              prefecture,
              bike_maker,
              bike_model,
              shooting_genres,
              price_range_min,
              price_range_max,
              equipment,
              bio,
              profile_image,
              portfolio_website,
              instagram_url,
              twitter_url,
              youtube_url,
              special_conditions,
              is_accepting_requests: value,
              average_rating,
              review_count,
            };
            const result = onChange(modelFields);
            value = result?.is_accepting_requests ?? value;
          }
          if (errors.is_accepting_requests?.hasError) {
            runValidationTasks("is_accepting_requests", value);
          }
          setIs_accepting_requests(value);
        }}
        onBlur={() =>
          runValidationTasks("is_accepting_requests", is_accepting_requests)
        }
        errorMessage={errors.is_accepting_requests?.errorMessage}
        hasError={errors.is_accepting_requests?.hasError}
        {...getOverrideProps(overrides, "is_accepting_requests")}
      ></SwitchField>
      <TextField
        label="Average rating"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={average_rating}
        onChange={(e) => {
          let value = isNaN(parseFloat(e.target.value))
            ? e.target.value
            : parseFloat(e.target.value);
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type,
              prefecture,
              bike_maker,
              bike_model,
              shooting_genres,
              price_range_min,
              price_range_max,
              equipment,
              bio,
              profile_image,
              portfolio_website,
              instagram_url,
              twitter_url,
              youtube_url,
              special_conditions,
              is_accepting_requests,
              average_rating: value,
              review_count,
            };
            const result = onChange(modelFields);
            value = result?.average_rating ?? value;
          }
          if (errors.average_rating?.hasError) {
            runValidationTasks("average_rating", value);
          }
          setAverage_rating(value);
        }}
        onBlur={() => runValidationTasks("average_rating", average_rating)}
        errorMessage={errors.average_rating?.errorMessage}
        hasError={errors.average_rating?.hasError}
        {...getOverrideProps(overrides, "average_rating")}
      ></TextField>
      <TextField
        label="Review count"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={review_count}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              email,
              nickname,
              user_type,
              prefecture,
              bike_maker,
              bike_model,
              shooting_genres,
              price_range_min,
              price_range_max,
              equipment,
              bio,
              profile_image,
              portfolio_website,
              instagram_url,
              twitter_url,
              youtube_url,
              special_conditions,
              is_accepting_requests,
              average_rating,
              review_count: value,
            };
            const result = onChange(modelFields);
            value = result?.review_count ?? value;
          }
          if (errors.review_count?.hasError) {
            runValidationTasks("review_count", value);
          }
          setReview_count(value);
        }}
        onBlur={() => runValidationTasks("review_count", review_count)}
        errorMessage={errors.review_count?.errorMessage}
        hasError={errors.review_count?.hasError}
        {...getOverrideProps(overrides, "review_count")}
      ></TextField>
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Button
          children="Clear"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          {...getOverrideProps(overrides, "ClearButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={Object.values(errors).some((e) => e?.hasError)}
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
