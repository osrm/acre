// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@thesis/solidity-contracts/contracts/token/IReceiveApproval.sol";

contract Acre is ERC4626, IReceiveApproval {
    event Staked(bytes32 indexed referral, uint256 assets, uint256 shares);

    constructor(
        IERC20 _token
    ) ERC4626(_token) ERC20("Acre Staked Bitcoin", "stBTC") {}

    /// @notice Receives approval of token transfer and stakes the approved
    ///         amount.
    /// @dev Requires that the provided token contract be the same one linked to
    ///      this contract.
    /// @param from The owner of the tokens who approved them to transfer.
    /// @param amount Approved amount for the transfer and stake.
    /// @param token Token contract address.
    /// @param extraData Extra data for stake. This byte array must have the
    ///        following values concatenated:
    ///        - referral (32 bytes)
    function receiveApproval(
        address from,
        uint256 amount,
        address token,
        bytes calldata extraData
    ) external override {
        require(token == asset(), "Unrecognized token");
        // TODO: Decide on the format of the `extradata` variable.
        require(extraData.length == 32, "Corrupted stake data");

        stake(amount, from, bytes32(extraData));
    }

    /// @notice Stakes a given amount of underlying token and mints shares to a
    ///         receiver.
    /// @dev This function calls `deposit` function from `ERC4626` contract.
    /// @param assets Approved amount for the transfer and stake.
    /// @param receiver The address to which the shares will be minted.
    /// @param referral Data used for referral program.
    /// @return shares Minted shares.
    function stake(
        uint256 assets,
        address receiver,
        bytes32 referral
    ) public returns (uint256 shares) {
        shares = deposit(assets, receiver);

        emit Staked(referral, assets, shares);

        return shares;
    }
}
