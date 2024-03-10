// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.21;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./stBTC.sol";
import "./bridge/ITBTCToken.sol";

/// @title Bitcoin Redeemer
/// @notice This contract facilitates redemption of stBTC tokens to Bitcoin through
///         tBTC redemption process.
contract BitcoinRedeemer is Initializable {
    /// Interface for tBTC token contract.
    ITBTCToken public tbtcToken;

    /// stBTC token contract.
    stBTC public stbtc;

    /// Emitted when redemption is requested.
    /// @param owner Owner of stBTC tokens.
    /// @param shares Number of stBTC tokens.
    /// @param tbtcAmount Number of tBTC tokens.
    event RedemptionRequested(
        address indexed owner,
        uint256 shares,
        uint256 tbtcAmount
    );

    /// Reverts if the tBTC Token address is zero.
    error TbtcTokenZeroAddress();

    /// Reverts if the stBTC address is zero.
    error StbtcZeroAddress();

    /// Reverts when approveAndCall to tBTC contract fails.
    error ApproveAndCallFailed();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the contract with tBTC token and stBTC token addresses
    /// @param _tbtcToken The address of the tBTC token contract
    /// @param _stbtc The address of the stBTC token contract
    function initialize(address _tbtcToken, address _stbtc) public initializer {
        if (address(_tbtcToken) == address(0)) {
            revert TbtcTokenZeroAddress();
        }
        if (address(_stbtc) == address(0)) {
            revert StbtcZeroAddress();
        }

        tbtcToken = ITBTCToken(_tbtcToken);
        stbtc = stBTC(_stbtc);
    }

    /// @notice Initiates the redemption process by exchanging stBTC tokens for
    ///         tBTC tokens.
    /// @dev Redeems stBTC shares to receive tBTC and requests redemption of tBTC
    ///      to Bitcoin via tBTC Bridge.
    ///      Redemption data in a format expected from `redemptionData` parameter
    ///      of Bridge's `receiveBalanceApproval`.
    ///      It uses tBTC token owner which is the TBTCVault contract as spender
    ///      of tBTC requested for redemption.
    /// @dev tBTC Bridge redemption process has a path where request can timeout.
    ///      It is a scenario that is unlikely to
    /// @param owner The owner of the stBTC tokens.
    /// @param shares The number of stBTC tokens to redeem.
    /// @param tbtcRedemptionData Additional data required for the tBTC redemption.
    function requestRedemption(
        address owner,
        uint256 shares,
        bytes calldata tbtcRedemptionData
    ) public {
        uint256 tbtcAmount = stbtc.redeem(shares, address(this), owner);

        emit RedemptionRequested(owner, shares, tbtcAmount);

        if (
            !tbtcToken.approveAndCall(
                tbtcToken.owner(),
                tbtcAmount,
                tbtcRedemptionData
            )
        ) {
            revert ApproveAndCallFailed();
        }
    }
}
