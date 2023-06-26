const SteamUserMessages = require("../../node_modules/steam-user/components/03-messages.js");
const EMsg = require("steam-user").EMsg;

const Schema = require("../../node_modules/steam-user/protobufs/generated/_load.js");
const ByteBuffer = require("bytebuffer");

const JOBID_NONE = "18446744073709551615";
const PROTO_MASK = 0x80000000;

const VERBOSE_EMSG_LIST = [
    EMsg.Multi,
    EMsg.ClientHeartBeat
];

const protobufs = {};
protobufs[EMsg.Multi] = Schema.CMsgMulti;
protobufs[EMsg.ClientHeartBeat] = Schema.CMsgClientHeartBeat;
protobufs[EMsg.ClientHello] = Schema.CMsgClientHello;
protobufs[EMsg.ClientLogon] = Schema.CMsgClientLogon;
protobufs[EMsg.ClientLogonGameServer] = Schema.CMsgClientLogon;
protobufs[EMsg.ClientLogOnResponse] = Schema.CMsgClientLogonResponse;
protobufs[EMsg.ClientLogOff] = Schema.CMsgClientLogOff;
protobufs[EMsg.ClientLoggedOff] = Schema.CMsgClientLoggedOff;
protobufs[EMsg.ClientUpdateMachineAuth] = Schema.CMsgClientUpdateMachineAuth;
protobufs[EMsg.ClientUpdateMachineAuthResponse] = Schema.CMsgClientUpdateMachineAuthResponse;
protobufs[EMsg.ClientNewLoginKey] = Schema.CMsgClientNewLoginKey;
protobufs[EMsg.ClientNewLoginKeyAccepted] = Schema.CMsgClientNewLoginKeyAccepted;
protobufs[EMsg.ClientRequestWebAPIAuthenticateUserNonce] = Schema.CMsgClientRequestWebAPIAuthenticateUserNonce;
protobufs[EMsg.ClientRequestWebAPIAuthenticateUserNonceResponse] = Schema.CMsgClientRequestWebAPIAuthenticateUserNonceResponse;
protobufs[EMsg.ClientCMList] = Schema.CMsgClientCMList;
protobufs[EMsg.ClientItemAnnouncements] = Schema.CMsgClientItemAnnouncements;
protobufs[EMsg.ClientRequestItemAnnouncements] = Schema.CMsgClientRequestItemAnnouncements;
protobufs[EMsg.ClientCommentNotifications] = Schema.CMsgClientCommentNotifications;
protobufs[EMsg.ClientRequestCommentNotifications] = Schema.CMsgClientRequestCommentNotifications;
protobufs[EMsg.ClientUserNotifications] = Schema.CMsgClientUserNotifications;
protobufs[EMsg.ClientFSOfflineMessageNotification] = Schema.CMsgClientOfflineMessageNotification;
protobufs[EMsg.ClientFSRequestOfflineMessageCount] = Schema.CMsgClientRequestOfflineMessageCount;
protobufs[EMsg.ClientGamesPlayed] = Schema.CMsgClientGamesPlayed;
protobufs[EMsg.ClientGamesPlayedWithDataBlob] = Schema.CMsgClientGamesPlayed;
protobufs[EMsg.ClientAccountInfo] = Schema.CMsgClientAccountInfo;
protobufs[EMsg.ClientEmailAddrInfo] = Schema.CMsgClientEmailAddrInfo;
protobufs[EMsg.ClientIsLimitedAccount] = Schema.CMsgClientIsLimitedAccount;
protobufs[EMsg.ClientWalletInfoUpdate] = Schema.CMsgClientWalletInfoUpdate;
protobufs[EMsg.ClientLicenseList] = Schema.CMsgClientLicenseList;
protobufs[EMsg.ClientServiceMethodLegacy] = Schema.CMsgClientServiceMethodLegacy;
protobufs[EMsg.ClientServiceMethodLegacyResponse] = Schema.CMsgClientServiceMethodLegacyResponse;
protobufs[EMsg.ClientGMSServerQuery] = Schema.CMsgClientGMSServerQuery;
protobufs[EMsg.GMSClientServerQueryResponse] = Schema.CMsgGMSClientServerQueryResponse;
protobufs[EMsg.ClientPICSChangesSinceRequest] = Schema.CMsgClientPICSChangesSinceRequest;
protobufs[EMsg.ClientPICSChangesSinceResponse] = Schema.CMsgClientPICSChangesSinceResponse;
protobufs[EMsg.ClientPICSProductInfoRequest] = Schema.CMsgClientPICSProductInfoRequest;
protobufs[EMsg.ClientPICSProductInfoResponse] = Schema.CMsgClientPICSProductInfoResponse;
protobufs[EMsg.ClientPICSAccessTokenRequest] = Schema.CMsgClientPICSAccessTokenRequest;
protobufs[EMsg.ClientPICSAccessTokenResponse] = Schema.CMsgClientPICSAccessTokenResponse;
protobufs[EMsg.EconTrading_InitiateTradeRequest] = Schema.CMsgTrading_InitiateTradeRequest;
protobufs[EMsg.EconTrading_InitiateTradeResponse] = Schema.CMsgTrading_InitiateTradeResponse;
protobufs[EMsg.EconTrading_CancelTradeRequest] = Schema.CMsgTrading_CancelTradeRequest;
protobufs[EMsg.EconTrading_InitiateTradeProposed] = Schema.CMsgTrading_InitiateTradeRequest;
protobufs[EMsg.EconTrading_InitiateTradeResult] = Schema.CMsgTrading_InitiateTradeResponse;
protobufs[EMsg.EconTrading_StartSession] = Schema.CMsgTrading_StartSession;
protobufs[EMsg.ClientChangeStatus] = Schema.CMsgClientChangeStatus;
protobufs[EMsg.ClientAddFriend] = Schema.CMsgClientAddFriend;
protobufs[EMsg.ClientAddFriendResponse] = Schema.CMsgClientAddFriendResponse;
protobufs[EMsg.ClientRemoveFriend] = Schema.CMsgClientRemoveFriend;
protobufs[EMsg.ClientFSGetFriendsSteamLevels] = Schema.CMsgClientFSGetFriendsSteamLevels;
protobufs[EMsg.ClientFSGetFriendsSteamLevelsResponse] = Schema.CMsgClientFSGetFriendsSteamLevelsResponse;
protobufs[EMsg.ClientPersonaState] = Schema.CMsgClientPersonaState;
protobufs[EMsg.ClientClanState] = Schema.CMsgClientClanState;
protobufs[EMsg.ClientFriendsList] = Schema.CMsgClientFriendsList;
protobufs[EMsg.ClientRequestFriendData] = Schema.CMsgClientRequestFriendData;
protobufs[EMsg.ClientFriendMsg] = Schema.CMsgClientFriendMsg;
protobufs[EMsg.ClientChatInvite] = Schema.CMsgClientChatInvite;
protobufs[EMsg.ClientFriendMsgIncoming] = Schema.CMsgClientFriendMsgIncoming;
protobufs[EMsg.ClientFriendMsgEchoToSender] = Schema.CMsgClientFriendMsgIncoming;
protobufs[EMsg.ClientFSGetFriendMessageHistory] = Schema.CMsgClientChatGetFriendMessageHistory;
protobufs[EMsg.ClientFSGetFriendMessageHistoryResponse] = Schema.CMsgClientChatGetFriendMessageHistoryResponse;
protobufs[EMsg.ClientFriendsGroupsList] = Schema.CMsgClientFriendsGroupsList;
protobufs[EMsg.AMClientCreateFriendsGroup] = Schema.CMsgClientCreateFriendsGroup;
protobufs[EMsg.AMClientCreateFriendsGroupResponse] = Schema.CMsgClientCreateFriendsGroupResponse;
protobufs[EMsg.AMClientDeleteFriendsGroup] = Schema.CMsgClientDeleteFriendsGroup;
protobufs[EMsg.AMClientDeleteFriendsGroupResponse] = Schema.CMsgClientDeleteFriendsGroupResponse;
protobufs[EMsg.AMClientRenameFriendsGroup] = Schema.CMsgClientManageFriendsGroup;
protobufs[EMsg.AMClientRenameFriendsGroupResponse] = Schema.CMsgClientManageFriendsGroupResponse;
protobufs[EMsg.AMClientAddFriendToGroup] = Schema.CMsgClientAddFriendToGroup;
protobufs[EMsg.AMClientAddFriendToGroupResponse] = Schema.CMsgClientAddFriendToGroupResponse;
protobufs[EMsg.AMClientRemoveFriendFromGroup] = Schema.CMsgClientRemoveFriendFromGroup;
protobufs[EMsg.AMClientRemoveFriendFromGroupResponse] = Schema.CMsgClientRemoveFriendFromGroupResponse;
protobufs[EMsg.ClientPlayerNicknameList] = Schema.CMsgClientPlayerNicknameList;
protobufs[EMsg.AMClientSetPlayerNickname] = Schema.CMsgClientSetPlayerNickname;
protobufs[EMsg.AMClientSetPlayerNicknameResponse] = Schema.CMsgClientSetPlayerNicknameResponse;
protobufs[EMsg.ClientRegisterKey] = Schema.CMsgClientRegisterKey;
protobufs[EMsg.ClientPurchaseResponse] = Schema.CMsgClientPurchaseResponse;
protobufs[EMsg.ClientRequestFreeLicense] = Schema.CMsgClientRequestFreeLicense;
protobufs[EMsg.ClientRequestFreeLicenseResponse] = Schema.CMsgClientRequestFreeLicenseResponse;
protobufs[EMsg.ClientGetNumberOfCurrentPlayersDP] = Schema.CMsgDPGetNumberOfCurrentPlayers;
protobufs[EMsg.ClientGetNumberOfCurrentPlayersDPResponse] = Schema.CMsgDPGetNumberOfCurrentPlayersResponse;
protobufs[EMsg.ClientGetAppOwnershipTicket] = Schema.CMsgClientGetAppOwnershipTicket;
protobufs[EMsg.ClientGetAppOwnershipTicketResponse] = Schema.CMsgClientGetAppOwnershipTicketResponse;
protobufs[EMsg.ClientGameConnectTokens] = Schema.CMsgClientGameConnectTokens;
protobufs[EMsg.ClientAuthList] = Schema.CMsgClientAuthList;
protobufs[EMsg.ClientAuthListAck] = Schema.CMsgClientAuthListAck;
protobufs[EMsg.ClientTicketAuthComplete] = Schema.CMsgClientTicketAuthComplete;
protobufs[EMsg.ClientRequestEncryptedAppTicket] = Schema.CMsgClientRequestEncryptedAppTicket;
protobufs[EMsg.ClientRequestEncryptedAppTicketResponse] = Schema.CMsgClientRequestEncryptedAppTicketResponse;
protobufs[EMsg.ClientCurrentUIMode] = Schema.CMsgClientUIMode;
protobufs[EMsg.ClientVanityURLChangedNotification] = Schema.CMsgClientVanityURLChangedNotification;
protobufs[EMsg.ClientAMGetPersonaNameHistory] = Schema.CMsgClientAMGetPersonaNameHistory;
protobufs[EMsg.ClientAMGetPersonaNameHistoryResponse] = Schema.CMsgClientAMGetPersonaNameHistoryResponse;
// Protobufs[EMsg.ClientUnlockStreaming] = Schema.CMsgAMUnlockStreaming;
// protobufs[EMsg.ClientUnlockStreamingResponse] = Schema.CMsgAMUnlockStreamingResponse;
protobufs[EMsg.ClientGetDepotDecryptionKey] = Schema.CMsgClientGetDepotDecryptionKey;
protobufs[EMsg.ClientGetDepotDecryptionKeyResponse] = Schema.CMsgClientGetDepotDecryptionKeyResponse;
protobufs[EMsg.ClientGetCDNAuthToken] = Schema.CMsgClientGetCDNAuthToken;
protobufs[EMsg.ClientGetCDNAuthTokenResponse] = Schema.CMsgClientGetCDNAuthTokenResponse;
protobufs[EMsg.ClientCheckAppBetaPassword] = Schema.CMsgClientCheckAppBetaPassword;
protobufs[EMsg.ClientCheckAppBetaPasswordResponse] = Schema.CMsgClientCheckAppBetaPasswordResponse;
protobufs[EMsg.ClientKickPlayingSession] = Schema.CMsgClientKickPlayingSession;
protobufs[EMsg.ClientPlayingSessionState] = Schema.CMsgClientPlayingSessionState;
protobufs[EMsg.ClientToGC] = Schema.CMsgGCClient;
protobufs[EMsg.ClientFromGC] = Schema.CMsgGCClient;
protobufs[EMsg.ClientRichPresenceUpload] = Schema.CMsgClientRichPresenceUpload;
protobufs[EMsg.ClientRichPresenceRequest] = Schema.CMsgClientRichPresenceRequest;
protobufs[EMsg.ClientRichPresenceInfo] = Schema.CMsgClientRichPresenceInfo;
protobufs[EMsg.ClientGetEmoticonList] = Schema.CMsgClientGetEmoticonList;
protobufs[EMsg.ClientEmoticonList] = Schema.CMsgClientEmoticonList;
protobufs[EMsg.ClientGetAuthorizedDevicesResponse] = Schema.CMsgClientGetAuthorizedDevices;
protobufs[EMsg.ClientAuthorizeLocalDeviceRequest] = Schema.CMsgClientAuthorizeLocalDeviceRequest;
protobufs[EMsg.ClientAuthorizeLocalDeviceResponse] = Schema.CMsgClientAuthorizeLocalDevice;
protobufs[EMsg.ClientDeauthorizeDeviceRequest] = Schema.CMsgClientDeauthorizeDeviceRequest;
protobufs[EMsg.ClientDeauthorizeDevice] = Schema.CMsgClientDeauthorizeDevice;
protobufs[EMsg.ClientUseLocalDeviceAuthorizations] = Schema.CMsgClientUseLocalDeviceAuthorizations;

// Unified protobufs
protobufs["GameServers.GetServerList#1_Request"] = Schema.CGameServers_GetServerList_Request;
protobufs["GameServers.GetServerList#1_Response"] = Schema.CGameServers_GetServerList_Response;
protobufs["GameServers.GetServerSteamIDsByIP#1_Request"] = Schema.CGameServers_GetServerSteamIDsByIP_Request;
protobufs["GameServers.GetServerSteamIDsByIP#1_Response"] = Schema.CGameServers_IPsWithSteamIDs_Response;
protobufs["GameServers.GetServerIPsBySteamID#1_Request"] = Schema.CGameServers_GetServerIPsBySteamID_Request;
protobufs["GameServers.GetServerIPsBySteamID#1_Response"] = Schema.CGameServers_IPsWithSteamIDs_Response;
protobufs["TwoFactor.AddAuthenticator#1_Request"] = Schema.CTwoFactor_AddAuthenticator_Request;
protobufs["TwoFactor.AddAuthenticator#1_Response"] = Schema.CTwoFactor_AddAuthenticator_Response;
protobufs["TwoFactor.FinalizeAddAuthenticator#1_Request"] = Schema.CTwoFactor_FinalizeAddAuthenticator_Request;
protobufs["TwoFactor.FinalizeAddAuthenticator#1_Response"] = Schema.CTwoFactor_FinalizeAddAuthenticator_Response;
protobufs["TwoFactor.SendEmail#1_Request"] = Schema.CTwoFactor_SendEmail_Request;
protobufs["TwoFactor.SendEmail#1_Response"] = Schema.CTwoFactor_SendEmail_Response;
protobufs["TwoFactor.RemoveAuthenticator#1_Request"] = Schema.CTwoFactor_RemoveAuthenticator_Request;
protobufs["TwoFactor.RemoveAuthenticator#1_Response"] = Schema.CTwoFactor_RemoveAuthenticator_Response;
protobufs["Credentials.GetSteamGuardDetails#1_Request"] = Schema.CCredentials_GetSteamGuardDetails_Request;
protobufs["Credentials.GetSteamGuardDetails#1_Response"] = Schema.CCredentials_GetSteamGuardDetails_Response;
protobufs["Credentials.GetAccountAuthSecret#1_Request"] = Schema.CCredentials_GetAccountAuthSecret_Request;
protobufs["Credentials.GetAccountAuthSecret#1_Response"] = Schema.CCredentials_GetAccountAuthSecret_Response;
protobufs["Credentials.GetCredentialChangeTimeDetails#1_Request"] = Schema.CCredentials_LastCredentialChangeTime_Request;
protobufs["Credentials.GetCredentialChangeTimeDetails#1_Response"] = Schema.CCredentials_LastCredentialChangeTime_Response;
protobufs["PublishedFile.GetDetails#1_Request"] = Schema.CPublishedFile_GetDetails_Request;
protobufs["PublishedFile.GetDetails#1_Response"] = Schema.CPublishedFile_GetDetails_Response;
protobufs["Player.GetGameBadgeLevels#1_Request"] = Schema.CPlayer_GetGameBadgeLevels_Request;
protobufs["Player.GetGameBadgeLevels#1_Response"] = Schema.CPlayer_GetGameBadgeLevels_Response;
protobufs["Player.GetNicknameList#1_Request"] = Schema.CPlayer_GetNicknameList_Request;
protobufs["Player.GetNicknameList#1_Response"] = Schema.CPlayer_GetNicknameList_Response;
protobufs["Player.GetEmoticonList#1_Request"] = Schema.CPlayer_GetEmoticonList_Request;
protobufs["Player.GetEmoticonList#1_Response"] = Schema.CPlayer_GetEmoticonList_Response;
protobufs["Player.GetPrivacySettings#1_Request"] = Schema.CPlayer_GetPrivacySettings_Request;
protobufs["Player.GetPrivacySettings#1_Response"] = Schema.CPlayer_GetPrivacySettings_Response;
protobufs["Player.GetOwnedGames#1_Request"] = Schema.CPlayer_GetOwnedGames_Request;
protobufs["Player.GetOwnedGames#1_Response"] = Schema.CPlayer_GetOwnedGames_Response;
protobufs["Player.GetProfileItemsOwned#1_Request"] = Schema.CPlayer_GetProfileItemsOwned_Request;
protobufs["Player.GetProfileItemsOwned#1_Response"] = Schema.CPlayer_GetProfileItemsOwned_Response;
protobufs["Player.GetProfileItemsEquipped#1_Request"] = Schema.CPlayer_GetProfileItemsEquipped_Request;
protobufs["Player.GetProfileItemsEquipped#1_Response"] = Schema.CPlayer_GetProfileItemsEquipped_Response;
protobufs["Player.GetProfileBackground#1_Request"] = Schema.CPlayer_GetProfileBackground_Request;
protobufs["Player.GetProfileBackground#1_Response"] = Schema.CPlayer_GetProfileBackground_Response;
protobufs["Player.SetProfileBackground#1_Request"] = Schema.CPlayer_SetProfileBackground_Request;
protobufs["Player.SetProfileBackground#1_Response"] = Schema.CPlayer_SetProfileBackground_Response;
protobufs["PlayerClient.NotifyFriendNicknameChanged#1"] = Schema.CPlayer_FriendNicknameChanged_Notification;
protobufs["Econ.GetAssetClassInfo#1_Request"] = Schema.CEcon_GetAssetClassInfo_Request;
protobufs["Econ.GetAssetClassInfo#1_Response"] = Schema.CEcon_GetAssetClassInfo_Response;
protobufs["Store.GetLocalizedNameForTags#1_Request"] = Schema.CStore_GetLocalizedNameForTags_Request;
protobufs["Store.GetLocalizedNameForTags#1_Response"] = Schema.CStore_GetLocalizedNameForTags_Response;
protobufs["Econ.GetTradeOfferAccessToken#1_Request"] = Schema.CEcon_GetTradeOfferAccessToken_Request;
protobufs["Econ.GetTradeOfferAccessToken#1_Response"] = Schema.CEcon_GetTradeOfferAccessToken_Response;
protobufs["ChatRoom.CreateChatRoomGroup#1_Request"] = Schema.CChatRoom_CreateChatRoomGroup_Request;
protobufs["ChatRoom.CreateChatRoomGroup#1_Response"] = Schema.CChatRoom_CreateChatRoomGroup_Response;
protobufs["ChatRoom.SaveChatRoomGroup#1_Request"] = Schema.CChatRoom_SaveChatRoomGroup_Request;
protobufs["ChatRoom.SaveChatRoomGroup#1_Response"] = Schema.CChatRoom_SaveChatRoomGroup_Response;
protobufs["ChatRoom.RenameChatRoomGroup#1_Request"] = Schema.CChatRoom_RenameChatRoomGroup_Request;
protobufs["ChatRoom.RenameChatRoomGroup#1_Response"] = Schema.CChatRoom_RenameChatRoomGroup_Response;
protobufs["ChatRoom.SetChatRoomGroupTagline#1_Request"] = Schema.CChatRoom_SetChatRoomGroupTagline_Request;
protobufs["ChatRoom.SetChatRoomGroupTagline#1_Response"] = Schema.CChatRoom_SetChatRoomGroupTagline_Response;
protobufs["ChatRoom.SetChatRoomGroupAvatar#1_Request"] = Schema.CChatRoom_SetChatRoomGroupAvatar_Request;
protobufs["ChatRoom.SetChatRoomGroupAvatar#1_Response"] = Schema.CChatRoom_SetChatRoomGroupAvatar_Response;
protobufs["ChatRoom.MuteUserInGroup#1_Request"] = Schema.CChatRoom_MuteUser_Request;
protobufs["ChatRoom.MuteUserInGroup#1_Response"] = Schema.CChatRoom_MuteUser_Response;
protobufs["ChatRoom.KickUserFromGroup#1_Request"] = Schema.CChatRoom_KickUser_Request;
protobufs["ChatRoom.KickUserFromGroup#1_Response"] = Schema.CChatRoom_KickUser_Response;
protobufs["ChatRoom.SetUserBanState#1_Request"] = Schema.CChatRoom_SetUserBanState_Request;
protobufs["ChatRoom.SetUserBanState#1_Response"] = Schema.CChatRoom_SetUserBanState_Response;
protobufs["ChatRoom.RevokeInviteToGroup#1_Request"] = Schema.CChatRoom_RevokeInvite_Request;
protobufs["ChatRoom.RevokeInviteToGroup#1_Response"] = Schema.CChatRoom_RevokeInvite_Response;
protobufs["ChatRoom.CreateRole#1_Request"] = Schema.CChatRoom_CreateRole_Request;
protobufs["ChatRoom.CreateRole#1_Response"] = Schema.CChatRoom_CreateRole_Response;
protobufs["ChatRoom.GetRoles#1_Request"] = Schema.CChatRoom_GetRoles_Request;
protobufs["ChatRoom.GetRoles#1_Response"] = Schema.CChatRoom_GetRoles_Response;
protobufs["ChatRoom.RenameRole#1_Request"] = Schema.CChatRoom_RenameRole_Request;
protobufs["ChatRoom.RenameRole#1_Response"] = Schema.CChatRoom_RenameRole_Response;
protobufs["ChatRoom.ReorderRole#1_Request"] = Schema.CChatRoom_ReorderRole_Request;
protobufs["ChatRoom.ReorderRole#1_Response"] = Schema.CChatRoom_ReorderRole_Response;
protobufs["ChatRoom.DeleteRole#1_Request"] = Schema.CChatRoom_DeleteRole_Request;
protobufs["ChatRoom.DeleteRole#1_Response"] = Schema.CChatRoom_DeleteRole_Response;
protobufs["ChatRoom.GetRoleActions#1_Request"] = Schema.CChatRoom_GetRoleActions_Request;
protobufs["ChatRoom.GetRoleActions#1_Response"] = Schema.CChatRoom_GetRoleActions_Response;
protobufs["ChatRoom.ReplaceRoleActions#1_Request"] = Schema.CChatRoom_ReplaceRoleActions_Request;
protobufs["ChatRoom.ReplaceRoleActions#1_Response"] = Schema.CChatRoom_ReplaceRoleActions_Response;
protobufs["ChatRoom.AddRoleToUser#1_Request"] = Schema.CChatRoom_AddRoleToUser_Request;
protobufs["ChatRoom.AddRoleToUser#1_Response"] = Schema.CChatRoom_AddRoleToUser_Response;
protobufs["ChatRoom.GetRolesForUser#1_Request"] = Schema.CChatRoom_GetRolesForUser_Request;
protobufs["ChatRoom.GetRolesForUser#1_Response"] = Schema.CChatRoom_GetRolesForUser_Response;
protobufs["ChatRoom.DeleteRoleFromUser#1_Request"] = Schema.CChatRoom_DeleteRoleFromUser_Request;
protobufs["ChatRoom.DeleteRoleFromUser#1_Response"] = Schema.CChatRoom_DeleteRoleFromUser_Response;
protobufs["ChatRoom.JoinChatRoomGroup#1_Request"] = Schema.CChatRoom_JoinChatRoomGroup_Request;
protobufs["ChatRoom.JoinChatRoomGroup#1_Response"] = Schema.CChatRoom_JoinChatRoomGroup_Response;
protobufs["ChatRoom.InviteFriendToChatRoomGroup#1_Request"] = Schema.CChatRoom_InviteFriendToChatRoomGroup_Request;
protobufs["ChatRoom.InviteFriendToChatRoomGroup#1_Response"] = Schema.CChatRoom_InviteFriendToChatRoomGroup_Response;
protobufs["ChatRoom.LeaveChatRoomGroup#1_Request"] = Schema.CChatRoom_LeaveChatRoomGroup_Request;
protobufs["ChatRoom.LeaveChatRoomGroup#1_Response"] = Schema.CChatRoom_LeaveChatRoomGroup_Response;
protobufs["ChatRoom.CreateChatRoom#1_Request"] = Schema.CChatRoom_CreateChatRoom_Request;
protobufs["ChatRoom.CreateChatRoom#1_Response"] = Schema.CChatRoom_CreateChatRoom_Response;
protobufs["ChatRoom.DeleteChatRoom#1_Request"] = Schema.CChatRoom_DeleteChatRoom_Request;
protobufs["ChatRoom.DeleteChatRoom#1_Response"] = Schema.CChatRoom_DeleteChatRoom_Response;
protobufs["ChatRoom.RenameChatRoom#1_Request"] = Schema.CChatRoom_RenameChatRoom_Request;
protobufs["ChatRoom.RenameChatRoom#1_Response"] = Schema.CChatRoom_RenameChatRoom_Response;
protobufs["ChatRoom.SendChatMessage#1_Request"] = Schema.CChatRoom_SendChatMessage_Request;
protobufs["ChatRoom.SendChatMessage#1_Response"] = Schema.CChatRoom_SendChatMessage_Response;
protobufs["ChatRoom.JoinVoiceChat#1_Request"] = Schema.CChatRoom_JoinVoiceChat_Request;
protobufs["ChatRoom.JoinVoiceChat#1_Response"] = Schema.CChatRoom_JoinVoiceChat_Response;
protobufs["ChatRoom.LeaveVoiceChat#1_Request"] = Schema.CChatRoom_LeaveVoiceChat_Request;
protobufs["ChatRoom.LeaveVoiceChat#1_Response"] = Schema.CChatRoom_LeaveVoiceChat_Response;
protobufs["ChatRoom.GetMessageHistory#1_Request"] = Schema.CChatRoom_GetMessageHistory_Request;
protobufs["ChatRoom.GetMessageHistory#1_Response"] = Schema.CChatRoom_GetMessageHistory_Response;
protobufs["ChatRoom.GetMyChatRoomGroups#1_Request"] = Schema.CChatRoom_GetMyChatRoomGroups_Request;
protobufs["ChatRoom.GetMyChatRoomGroups#1_Response"] = Schema.CChatRoom_GetMyChatRoomGroups_Response;
protobufs["ChatRoom.GetChatRoomGroupState#1_Request"] = Schema.CChatRoom_GetChatRoomGroupState_Request;
protobufs["ChatRoom.GetChatRoomGroupState#1_Response"] = Schema.CChatRoom_GetChatRoomGroupState_Response;
protobufs["ChatRoom.GetChatRoomGroupSummary#1_Request"] = Schema.CChatRoom_GetChatRoomGroupSummary_Request;
protobufs["ChatRoom.GetChatRoomGroupSummary#1_Response"] = Schema.CChatRoom_GetChatRoomGroupSummary_Response;
protobufs["ChatRoom.AckChatMessage#1"] = Schema.CChatRoom_AckChatMessage_Notification;
protobufs["ChatRoom.CreateInviteLink#1_Request"] = Schema.CChatRoom_CreateInviteLink_Request;
protobufs["ChatRoom.CreateInviteLink#1_Response"] = Schema.CChatRoom_CreateInviteLink_Response;
protobufs["ChatRoom.GetInviteLinkInfo#1_Request"] = Schema.CChatRoom_GetInviteLinkInfo_Request;
protobufs["ChatRoom.GetInviteLinkInfo#1_Response"] = Schema.CChatRoom_GetInviteLinkInfo_Response;
protobufs["ChatRoom.GetInviteInfo#1_Request"] = Schema.CChatRoom_GetInviteInfo_Request;
protobufs["ChatRoom.GetInviteInfo#1_Response"] = Schema.CChatRoom_GetInviteInfo_Response;
protobufs["ChatRoom.GetInviteLinksForGroup#1_Request"] = Schema.CChatRoom_GetInviteLinksForGroup_Request;
protobufs["ChatRoom.GetInviteLinksForGroup#1_Response"] = Schema.CChatRoom_GetInviteLinksForGroup_Response;
protobufs["ChatRoom.GetBanList#1_Request"] = Schema.CChatRoom_GetBanList_Request;
protobufs["ChatRoom.GetBanList#1_Response"] = Schema.CChatRoom_GetBanList_Response;
protobufs["ChatRoom.GetInviteList#1_Request"] = Schema.CChatRoom_GetInviteList_Request;
protobufs["ChatRoom.GetInviteList#1_Response"] = Schema.CChatRoom_GetInviteList_Response;
protobufs["ChatRoom.DeleteInviteLink#1_Request"] = Schema.CChatRoom_DeleteInviteLink_Request;
protobufs["ChatRoom.DeleteInviteLink#1_Response"] = Schema.CChatRoom_DeleteInviteLink_Response;
protobufs["ChatRoom.SetSessionActiveChatRoomGroups#1_Request"] = Schema.CChatRoom_SetSessionActiveChatRoomGroups_Request;
protobufs["ChatRoom.SetSessionActiveChatRoomGroups#1_Response"] = Schema.CChatRoom_SetSessionActiveChatRoomGroups_Response;
protobufs["ChatRoom.SetUserChatGroupPreferences#1_Request"] = Schema.CChatRoom_SetUserChatGroupPreferences_Request;
protobufs["ChatRoom.SetUserChatGroupPreferences#1_Response"] = Schema.CChatRoom_SetUserChatGroupPreferences_Response;
protobufs["ChatRoom.DeleteChatMessages#1_Request"] = Schema.CChatRoom_DeleteChatMessages_Request;
protobufs["ChatRoom.DeleteChatMessages#1_Response"] = Schema.CChatRoom_DeleteChatMessages_Response;
protobufs["ChatRoomClient.NotifyIncomingChatMessage#1"] = Schema.CChatRoom_IncomingChatMessage_Notification;
protobufs["ChatRoomClient.NotifyChatMessageModified#1"] = Schema.CChatRoom_ChatMessageModified_Notification;
protobufs["ChatRoomClient.NotifyMemberStateChange#1"] = Schema.CChatRoom_MemberStateChange_Notification;
protobufs["ChatRoomClient.NotifyChatRoomHeaderStateChange#1"] = Schema.CChatRoom_ChatRoomHeaderState_Notification;
protobufs["ChatRoomClient.NotifyChatRoomGroupRoomsChange#1"] = Schema.CChatRoom_ChatRoomGroupRoomsChange_Notification;
protobufs["ChatRoomClient.NotifyShouldRejoinChatRoomVoiceChat#1"] = Schema.CChatRoom_NotifyShouldRejoinChatRoomVoiceChat_Notification;
protobufs["ChatRoomClient.NotifyChatGroupUserStateChanged#1"] = Schema.ChatRoomClient_NotifyChatGroupUserStateChanged_Notification;
protobufs["ChatRoomClient.NotifyAckChatMessageEcho#1"] = Schema.CChatRoom_AckChatMessage_Notification;
protobufs["ClanChatRooms.GetClanChatRoomInfo#1_Request"] = Schema.CClanChatRooms_GetClanChatRoomInfo_Request;
protobufs["ClanChatRooms.GetClanChatRoomInfo#1_Response"] = Schema.CClanChatRooms_GetClanChatRoomInfo_Response;
protobufs["FriendMessages.GetRecentMessages#1_Request"] = Schema.CFriendMessages_GetRecentMessages_Request;
protobufs["FriendMessages.GetRecentMessages#1_Response"] = Schema.CFriendMessages_GetRecentMessages_Response;
protobufs["FriendMessages.GetActiveMessageSessions#1_Request"] = Schema.CFriendsMessages_GetActiveMessageSessions_Request;
protobufs["FriendMessages.GetActiveMessageSessions#1_Response"] = Schema.CFriendsMessages_GetActiveMessageSessions_Response;
protobufs["FriendMessages.SendMessage#1_Request"] = Schema.CFriendMessages_SendMessage_Request;
protobufs["FriendMessages.SendMessage#1_Response"] = Schema.CFriendMessages_SendMessage_Response;
protobufs["FriendMessages.AckMessage#1"] = Schema.CFriendMessages_AckMessage_Notification;
protobufs["FriendMessages.IsInFriendsUIBeta#1_Request"] = Schema.CFriendMessages_IsInFriendsUIBeta_Request;
protobufs["FriendMessages.IsInFriendsUIBeta#1_Response"] = Schema.CFriendMessages_IsInFriendsUIBeta_Response;
protobufs["FriendMessagesClient.IncomingMessage#1"] = Schema.CFriendMessages_IncomingMessage_Notification;
protobufs["FriendMessagesClient.NotifyAckMessageEcho#1"] = Schema.CFriendMessages_AckMessage_Notification;
protobufs["Community.GetAppRichPresenceLocalization#1_Request"] = Schema.CCommunity_GetAppRichPresenceLocalization_Request;
protobufs["Community.GetAppRichPresenceLocalization#1_Response"] = Schema.CCommunity_GetAppRichPresenceLocalization_Response;
protobufs["UserAccount.CreateFriendInviteToken#1_Request"] = Schema.CUserAccount_CreateFriendInviteToken_Request;
protobufs["UserAccount.CreateFriendInviteToken#1_Response"] = Schema.CUserAccount_CreateFriendInviteToken_Response;
protobufs["UserAccount.GetFriendInviteTokens#1_Request"] = Schema.CUserAccount_GetFriendInviteTokens_Request;
protobufs["UserAccount.GetFriendInviteTokens#1_Response"] = Schema.CUserAccount_GetFriendInviteTokens_Response;
protobufs["UserAccount.ViewFriendInviteToken#1_Request"] = Schema.CUserAccount_ViewFriendInviteToken_Request;
protobufs["UserAccount.ViewFriendInviteToken#1_Response"] = Schema.CUserAccount_ViewFriendInviteToken_Response;
protobufs["UserAccount.RedeemFriendInviteToken#1_Request"] = Schema.CUserAccount_RedeemFriendInviteToken_Request;
protobufs["UserAccount.RedeemFriendInviteToken#1_Response"] = Schema.CUserAccount_RedeemFriendInviteToken_Response;
protobufs["UserAccount.RevokeFriendInviteToken#1_Request"] = Schema.CUserAccount_RevokeFriendInviteToken_Request;
protobufs["UserAccount.RevokeFriendInviteToken#1_Response"] = Schema.CUserAccount_RevokeFriendInviteToken_Response;
protobufs["DeviceAuth.GetOwnAuthorizedDevices#1_Request"] = Schema.CDeviceAuth_GetOwnAuthorizedDevices_Request;
protobufs["DeviceAuth.GetOwnAuthorizedDevices#1_Response"] = Schema.CDeviceAuth_GetOwnAuthorizedDevices_Response;
protobufs["DeviceAuth.AddAuthorizedBorrowers#1_Request"] = Schema.CDeviceAuth_AddAuthorizedBorrowers_Request;
protobufs["DeviceAuth.AddAuthorizedBorrowers#1_Response"] = Schema.CDeviceAuth_AddAuthorizedBorrowers_Response;
protobufs["DeviceAuth.RemoveAuthorizedBorrowers#1_Request"] = Schema.CDeviceAuth_RemoveAuthorizedBorrowers_Request;
protobufs["DeviceAuth.RemoveAuthorizedBorrowers#1_Response"] = Schema.CDeviceAuth_RemoveAuthorizedBorrowers_Response;
protobufs["DeviceAuth.GetAuthorizedBorrowers#1_Request"] = Schema.CDeviceAuth_GetAuthorizedBorrowers_Request;
protobufs["DeviceAuth.GetAuthorizedBorrowers#1_Response"] = Schema.CDeviceAuth_GetAuthorizedBorrowers_Response;
protobufs["ContentServerDirectory.GetManifestRequestCode#1_Request"] = Schema.CContentServerDirectory_GetManifestRequestCode_Request;
protobufs["ContentServerDirectory.GetManifestRequestCode#1_Response"] = Schema.CContentServerDirectory_GetManifestRequestCode_Response;


/**
 * @param {int|object} emsgOrHeader
 * @param {object|Buffer|ByteBuffer} body
 * @param {function} [callback]
 * @protected
 */
SteamUserMessages.prototype._send = function(emsgOrHeader, body, callback) {
    // header fields: msg, proto, sourceJobID, targetJobID
    let header = typeof emsgOrHeader === 'object' ? emsgOrHeader : {"msg": emsgOrHeader};
    let emsg = header.msg;

    let canWeSend = this.steamID ||
        (
            this._tempSteamID &&
            [EMsg.ChannelEncryptResponse, EMsg.ClientLogon, EMsg.ClientHello, EMsg.ServiceMethodCallFromClientNonAuthed].includes(emsg)
        );
    if (!canWeSend) {
        // We're disconnected, drop it
        this.emit('debug', 'Dropping outgoing message ' + emsg + ' because we\'re not logged on.');
        return;
    }

    const Proto = protobufs[emsg];
    if (Proto) {
        header.proto = header.proto || {};
        body = SteamUserMessages._encodeProto(Proto, body);
    } else if (ByteBuffer.isByteBuffer(body)) {
        body = body.toBuffer();
    }

    let jobIdSource = null;
    if (callback) {
        jobIdSource = ++this._currentJobID;
        this._jobs[jobIdSource] = callback;
        this._jobs[jobIdSource].type = emsg; // Save type of this job to be able to filter the object later on

        // Clean up old job callbacks after 2 minutes
        this._jobCleanupTimers.push(setTimeout(() => delete this._jobs[jobIdSource], 1000 * 60 * 2));
    }

    let emsgName = EMsg[emsg] || emsg;
    if ([EMsg.ServiceMethodCallFromClient, EMsg.ServiceMethodCallFromClientNonAuthed].includes(emsg) && header.proto && header.proto.target_job_name) {
        emsgName = header.proto.target_job_name;
    }

    this.emit(VERBOSE_EMSG_LIST.includes(emsg) ? 'debug-verbose' : 'debug', 'Sending message: ' + emsgName);

    // Make the header
    let hdrBuf;
    if (header.msg == EMsg.ChannelEncryptResponse) {
        // since we're setting up the encrypted channel, we use this very minimal header
        hdrBuf = ByteBuffer.allocate(4 + 8 + 8, ByteBuffer.LITTLE_ENDIAN);
        hdrBuf.writeUint32(header.msg);
        hdrBuf.writeUint64(header.targetJobID || JOBID_NONE);
        hdrBuf.writeUint64(jobIdSource || header.sourceJobID || JOBID_NONE);
    } else if (header.proto) {
        // if we have a protobuf header, use that
        let shouldIncludeSessionId = ![EMsg.ClientHello, EMsg.ServiceMethodCallFromClientNonAuthed].includes(header.msg);
        header.proto.client_sessionid = shouldIncludeSessionId ? (this._sessionID || 0) : 0;
        header.proto.steamid = shouldIncludeSessionId ? (this.steamID || this._tempSteamID).getSteamID64() : '0';
        header.proto.jobid_source = jobIdSource || header.proto.jobid_source || header.sourceJobID || JOBID_NONE;
        header.proto.jobid_target = header.proto.jobid_target || header.targetJobID || JOBID_NONE;
        let hdrProtoBuf = SteamUserMessages._encodeProto(Schema.CMsgProtoBufHeader, header.proto);
        hdrBuf = ByteBuffer.allocate(4 + 4 + hdrProtoBuf.length, ByteBuffer.LITTLE_ENDIAN);
        hdrBuf.writeUint32(header.msg | PROTO_MASK);
        hdrBuf.writeUint32(hdrProtoBuf.length);
        hdrBuf.append(hdrProtoBuf);
    } else {
        // this is the standard non-protobuf extended header
        hdrBuf = ByteBuffer.allocate(4 + 1 + 2 + 8 + 8 + 1 + 8 + 4, ByteBuffer.LITTLE_ENDIAN);
        hdrBuf.writeUint32(header.msg);
        hdrBuf.writeByte(36);
        hdrBuf.writeUint16(2);
        hdrBuf.writeUint64(header.targetJobID || JOBID_NONE);
        hdrBuf.writeUint64(jobIdSource || header.sourceJobID || JOBID_NONE);
        hdrBuf.writeByte(239);
        hdrBuf.writeUint64((this.steamID || this._tempSteamID).getSteamID64());
        hdrBuf.writeUint32(this._sessionID || 0);
    }

    let outputBuffer = Buffer.concat([hdrBuf.flip().toBuffer(), body]);
    this.emit('debug-traffic-outgoing', outputBuffer, header.msg);
    this._connection.send(outputBuffer);
};