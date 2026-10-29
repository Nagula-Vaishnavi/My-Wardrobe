package com.mywardrobe.mywardrobe;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "GEMINI_API_KEY=")
@AutoConfigureMockMvc
class MyWardrobeApiTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void protectedWardrobeRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/clothes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void clothingAndOutfitsCannotCrossUserBoundaries() throws Exception {
        String suffix = Long.toUnsignedString(System.nanoTime());
        String ownerToken = registerAndLogin("owner" + suffix + "@example.test");
        String otherToken = registerAndLogin("other" + suffix + "@example.test");

        MvcResult firstItem = mockMvc.perform(post("/api/clothes")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Blue shirt\",\"category\":\"Shirts\"}"))
                .andExpect(status().isOk())
                .andReturn();
        long itemId = objectMapper.readTree(firstItem.getResponse().getContentAsString())
                .get("id").asLong();

        mockMvc.perform(get("/api/clothes")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    JsonNode items = objectMapper.readTree(result.getResponse().getContentAsString());
                    if (!items.isArray() || !items.isEmpty()) {
                        throw new AssertionError("A second account must not see the first account's clothing.");
                    }
                });

        mockMvc.perform(put("/api/clothes/" + itemId)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Stolen update\",\"category\":\"Bottoms\"}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .delete("/api/clothes/" + itemId)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());

        // Posting a forged ID must create a new row owned by the caller, never overwrite the other account's row.
        MvcResult forgedCreate = mockMvc.perform(post("/api/clothes")
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":" + itemId + ",\"name\":\"My skirt\",\"category\":\"Bottoms\"}"))
                .andExpect(status().isOk())
                .andReturn();
        long otherItemId = objectMapper.readTree(forgedCreate.getResponse().getContentAsString())
                .get("id").asLong();
        if (itemId == otherItemId) {
            throw new AssertionError("A client-supplied clothing ID must not be reused.");
        }

        MvcResult savedOutfit = mockMvc.perform(post("/api/outfits")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Blue shirt look\",\"occasion\":\"Casual\","
                                + "\"weather\":\"Warm\",\"clothingItemIds\":\"" + itemId + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        long outfitId = objectMapper.readTree(savedOutfit.getResponse().getContentAsString())
                .get("id").asLong();

        mockMvc.perform(patch("/api/outfits/" + outfitId + "/favorite?favorite=true")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());

        mockMvc.perform(patch("/api/outfits/" + outfitId + "/favorite?favorite=true")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(result -> {
                    JsonNode outfit = objectMapper.readTree(result.getResponse().getContentAsString());
                    if (!outfit.get("favorite").asBoolean()) {
                        throw new AssertionError("The saved outfit favorite flag was not persisted.");
                    }
                });

        mockMvc.perform(post("/api/outfits")
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Forged look\",\"clothingItemIds\":\"" + itemId + "\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void accountPreferencesAreStoredAndReturned() throws Exception {
        String email = "prefs" + Long.toUnsignedString(System.nanoTime()) + "@example.test";
        String token = registerAndLogin(email);

        mockMvc.perform(put("/api/auth/preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"style\":\"Elegant\",\"showPrices\":true}"))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(get("/api/auth/preferences")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode preferences = objectMapper.readTree(result.getResponse().getContentAsString());
        if (!"Elegant".equals(preferences.get("style").asText())
                || !preferences.get("showPrices").asBoolean()
                || !preferences.get("configured").asBoolean()) {
            throw new AssertionError("Preferences were not persisted for the account.");
        }
    }

    @Test
    void stylistAdviceIsAuthenticatedAndLimitedToTheUsersOwnClothes() throws Exception {
        mockMvc.perform(post("/api/stylist/advice")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"occasion\":\"Casual\",\"weather\":\"Warm\","
                                + "\"mood\":\"Everyday\",\"style\":\"Minimal\","
                                + "\"prioritizeComfort\":false,\"optionItemIds\":[[1]]}"))
                .andExpect(status().isUnauthorized());

        String suffix = Long.toUnsignedString(System.nanoTime());
        String ownerToken = registerAndLogin("stylist-owner" + suffix + "@example.test");
        String otherToken = registerAndLogin("stylist-other" + suffix + "@example.test");
        MvcResult itemResult = mockMvc.perform(post("/api/clothes")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Cotton shirt\",\"category\":\"Shirts\","
                                + "\"color\":\"White\",\"season\":\"Summer\"}"))
                .andExpect(status().isOk())
                .andReturn();
        long itemId = objectMapper.readTree(itemResult.getResponse().getContentAsString())
                .get("id").asLong();
        String request = "{\"occasion\":\"Casual\",\"weather\":\"Warm\","
                + "\"mood\":\"Everyday\",\"style\":\"Minimal\","
                + "\"prioritizeComfort\":false,\"optionItemIds\":[[" + itemId + "]]}";

        mockMvc.perform(post("/api/stylist/advice")
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isBadRequest());

        MvcResult ownAdvice = mockMvc.perform(post("/api/stylist/advice")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andReturn();
        if (ownAdvice.getResponse().getStatus() != 200) {
            throw new AssertionError("Owner's wardrobe should be accepted: "
                    + ownAdvice.getResponse().getContentAsString());
        }
        JsonNode advice = objectMapper.readTree(ownAdvice.getResponse().getContentAsString());
        if (advice.get("available").asBoolean()) {
            throw new AssertionError("Gemini must stay disabled in tests without an API key.");
        }
    }

    private String registerAndLogin(String email) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Test User\",\"email\":\"" + email
                                + "\",\"password\":\"Wardrobe-test-123\"}"))
                .andExpect(status().isCreated());

        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email
                                + "\",\"password\":\"Wardrobe-test-123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return login.getResponse().getContentAsString();
    }
}
