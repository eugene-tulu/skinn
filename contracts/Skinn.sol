// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Skinn — stake on your word.
/// @notice Commitment pools: put up MON on a promise. Keep it or lose it.
///         Event  — stake to RSVP. Check in with a code the host reveals at the venue.
///                  Show up: split the flakers' stakes. Flake: lose yours.
///         Bet    — two or more sides stake, a pre-agreed arbiter calls the winner.
///         Habit  — stake on a daily streak. Miss a day, your accountability
///                  partner takes the pot.
contract Skinn {
    // ---------------------------------------------------------------- types

    enum PoolType { Event, Bet, Habit }
    enum Status   { Open, Settled, Cancelled, Forfeited }

    struct Pool {
        PoolType ptype;
        Status   status;
        address  creator;
        address  counter;        // Bet: arbiter. Habit: beneficiary.
        uint96   stake;          // per-participant stake (Event/Bet) or total (Habit)
        uint40   deadline;       // Event: check-in cutoff. Bet: decision deadline.
        uint40   createdAt;
        bytes32  codeHash;       // Event: keccak256(abi.encodePacked(code))
        uint8    totalCheckIns;  // Habit: check-ins required
        uint8    doneCheckIns;   // Habit: check-ins completed
        uint40   lastCheckInAt;  // Habit: rolling window anchor
        uint16   joinedCount;
        uint16   checkedInCount;
        uint256  pot;
        address  winner;         // Bet
        string   title;
    }

    uint256 public constant MAX_PARTICIPANTS = 200;
    uint256 public constant HABIT_MIN_INTERVAL = 20 hours;
    uint256 public constant HABIT_MAX_INTERVAL = 28 hours;

    uint256 public poolCount;
    uint256 public totalStakedEver;
    uint256 public totalSettledEver;

    mapping(uint256 => Pool) public pools;
    mapping(uint256 => address[]) private _participants;
    mapping(uint256 => mapping(address => bool)) public joined;
    mapping(uint256 => mapping(address => bool)) public checkedIn;
    mapping(address => uint256) public claimable;

    bool private _locked;

    // ---------------------------------------------------------------- events

    event PoolCreated(uint256 indexed id, PoolType ptype, address indexed creator, uint256 stake, string title);
    event Joined(uint256 indexed id, address indexed who);
    event CheckedIn(uint256 indexed id, address indexed who, uint256 done, uint256 total);
    event WinnerDeclared(uint256 indexed id, address indexed winner);
    event Settled(uint256 indexed id, uint256 pot, uint16 winners);
    event Forfeited(uint256 indexed id, address indexed beneficiary, uint256 pot);
    event Cancelled(uint256 indexed id);
    event Withdrawn(address indexed who, uint256 amount);

    // ---------------------------------------------------------------- errors

    error Locked();
    error BadStake();
    error BadDeadline();
    error BadCode();
    error BadCounter();
    error NotFound();
    error NotOpen();
    error WrongType();
    error WrongValue();
    error AlreadyJoined();
    error CantJoin();
    error NotJoined();
    error TooLate();
    error TooEarly();
    error AlreadyCheckedIn();
    error NotCreator();
    error NotArbiter();
    error NotBeneficiary();
    error NotAllowed();
    error NothingToWithdraw();
    error TransferFailed();

    modifier nonReentrant() {
        if (_locked) revert Locked();
        _locked = true;
        _;
        _locked = false;
    }

    // ------------------------------------------------------------- creation

    /// @notice Create an RSVP pool. The check-in code's hash is committed now;
    ///         the host reveals the plaintext code at the venue.
    function createEvent(string calldata title, uint40 deadline, bytes32 codeHash)
        external payable returns (uint256 id)
    {
        if (msg.value == 0) revert BadStake();
        if (deadline <= block.timestamp) revert BadDeadline();
        if (codeHash == bytes32(0)) revert BadCode();

        id = poolCount++;
        Pool storage p = pools[id];
        p.ptype = PoolType.Event;
        p.creator = msg.sender;
        p.stake = uint96(msg.value);
        p.deadline = deadline;
        p.createdAt = uint40(block.timestamp);
        p.codeHash = codeHash;
        p.title = title;
        _join(id, p);
        emit PoolCreated(id, PoolType.Event, msg.sender, msg.value, title);
    }

    /// @notice Create a bet. Anyone may match the stake; the arbiter picks one
    ///         winner who takes the whole pot. No decision by the deadline = refunds.
    function createBet(string calldata title, address arbiter, uint40 decisionDeadline)
        external payable returns (uint256 id)
    {
        if (msg.value == 0) revert BadStake();
        if (decisionDeadline <= block.timestamp) revert BadDeadline();
        if (arbiter == address(0) || arbiter == msg.sender) revert BadCounter();

        id = poolCount++;
        Pool storage p = pools[id];
        p.ptype = PoolType.Bet;
        p.creator = msg.sender;
        p.counter = arbiter;
        p.stake = uint96(msg.value);
        p.deadline = decisionDeadline;
        p.createdAt = uint40(block.timestamp);
        p.title = title;
        _join(id, p);
        emit PoolCreated(id, PoolType.Bet, msg.sender, msg.value, title);
    }

    /// @notice Create a habit streak. Check in once every 20–28h window.
    ///         Finish all check-ins: full refund. Miss a window: beneficiary claims the pot.
    function createHabit(string calldata title, uint8 totalCheckIns, address beneficiary)
        external payable returns (uint256 id)
    {
        if (msg.value == 0) revert BadStake();
        if (totalCheckIns < 2 || totalCheckIns > 90) revert BadDeadline();
        if (beneficiary == address(0) || beneficiary == msg.sender) revert BadCounter();

        id = poolCount++;
        Pool storage p = pools[id];
        p.ptype = PoolType.Habit;
        p.creator = msg.sender;
        p.counter = beneficiary;
        p.stake = uint96(msg.value);
        p.createdAt = uint40(block.timestamp);
        p.lastCheckInAt = uint40(block.timestamp);
        p.totalCheckIns = totalCheckIns;
        p.title = title;
        _join(id, p);
        emit PoolCreated(id, PoolType.Habit, msg.sender, msg.value, title);
    }

    function _join(uint256 id, Pool storage p) internal {
        p.pot += msg.value;
        p.joinedCount += 1;
        _participants[id].push(msg.sender);
        joined[id][msg.sender] = true;
        totalStakedEver += msg.value;
    }

    // -------------------------------------------------------------- joining

    /// @notice Stake into an open Event or Bet pool.
    function join(uint256 id) external payable {
        Pool storage p = pools[id];
        if (p.createdAt == 0) revert NotFound();
        if (p.status != Status.Open) revert NotOpen();
        if (p.ptype == PoolType.Habit) revert CantJoin();
        if (msg.value != p.stake) revert WrongValue();
        if (joined[id][msg.sender]) revert AlreadyJoined();
        if (p.joinedCount >= MAX_PARTICIPANTS) revert CantJoin();
        if (p.ptype == PoolType.Event && block.timestamp >= p.deadline) revert TooLate();
        if (p.ptype == PoolType.Bet && msg.sender == p.counter) revert CantJoin();
        _join(id, p);
        emit Joined(id, msg.sender);
    }

    // ------------------------------------------------------------ check-ins

    /// @notice Event check-in with the code the host revealed at the venue.
    function checkIn(uint256 id, string calldata code) external {
        Pool storage p = pools[id];
        if (p.ptype != PoolType.Event) revert WrongType();
        if (p.status != Status.Open) revert NotOpen();
        if (!joined[id][msg.sender]) revert NotJoined();
        if (block.timestamp >= p.deadline) revert TooLate();
        if (checkedIn[id][msg.sender]) revert AlreadyCheckedIn();
        if (keccak256(abi.encodePacked(code)) != p.codeHash) revert BadCode();

        checkedIn[id][msg.sender] = true;
        p.checkedInCount += 1;
        emit CheckedIn(id, msg.sender, p.checkedInCount, 0);
    }

    /// @notice Habit check-in. Must land inside the rolling 20–28h window.
    function habitCheckIn(uint256 id) external {
        Pool storage p = pools[id];
        if (p.ptype != PoolType.Habit) revert WrongType();
        if (p.status != Status.Open) revert NotOpen();
        if (msg.sender != p.creator) revert NotCreator();
        if (block.timestamp > p.lastCheckInAt + HABIT_MAX_INTERVAL) revert TooLate();
        if (block.timestamp < p.lastCheckInAt + HABIT_MIN_INTERVAL) revert TooEarly();

        p.lastCheckInAt = uint40(block.timestamp);
        p.doneCheckIns += 1;
        emit CheckedIn(id, msg.sender, p.doneCheckIns, p.totalCheckIns);

        if (p.doneCheckIns == p.totalCheckIns) {
            p.status = Status.Settled;
            totalSettledEver += p.pot;
            claimable[p.creator] += p.pot;
            emit Settled(id, p.pot, 1);
        }
    }

    // ----------------------------------------------------------- resolution

    /// @notice Arbiter declares the winner of a bet. Winner takes the whole pot.
    function declareWinner(uint256 id, address winner) external {
        Pool storage p = pools[id];
        if (p.ptype != PoolType.Bet) revert WrongType();
        if (p.status != Status.Open) revert NotOpen();
        if (msg.sender != p.counter) revert NotArbiter();
        if (!joined[id][winner]) revert NotJoined();
        if (p.joinedCount < 2) revert NotAllowed();

        p.status = Status.Settled;
        p.winner = winner;
        totalSettledEver += p.pot;
        claimable[winner] += p.pot;
        emit WinnerDeclared(id, winner);
        emit Settled(id, p.pot, 1);
    }

    /// @notice Settle an event after its deadline. Attendees split the pot —
    ///         flakers fund the people who showed up. No-shows everywhere = refunds.
    function settle(uint256 id) external {
        Pool storage p = pools[id];
        if (p.ptype != PoolType.Event) revert WrongType();
        if (p.status != Status.Open) revert NotOpen();
        if (block.timestamp < p.deadline) revert TooEarly();

        p.status = Status.Settled;
        totalSettledEver += p.pot;
        address[] storage ps = _participants[id];

        if (p.checkedInCount == 0) {
            for (uint256 i = 0; i < ps.length; i++) {
                claimable[ps[i]] += p.stake;
            }
            emit Settled(id, p.pot, 0);
            return;
        }

        uint256 share = p.pot / p.checkedInCount;
        uint256 remainder = p.pot - share * p.checkedInCount;
        bool dustPaid;
        for (uint256 i = 0; i < ps.length; i++) {
            if (!checkedIn[id][ps[i]]) continue;
            uint256 amount = share;
            if (!dustPaid) { amount += remainder; dustPaid = true; }
            claimable[ps[i]] += amount;
        }
        emit Settled(id, p.pot, p.checkedInCount);
    }

    /// @notice Bet expired with no arbiter decision — everyone is refunded.
    function settleExpiredBet(uint256 id) external {
        Pool storage p = pools[id];
        if (p.ptype != PoolType.Bet) revert WrongType();
        if (p.status != Status.Open) revert NotOpen();
        if (block.timestamp < p.deadline) revert TooEarly();

        p.status = Status.Cancelled;
        address[] storage ps = _participants[id];
        for (uint256 i = 0; i < ps.length; i++) {
            claimable[ps[i]] += p.stake;
        }
        emit Cancelled(id);
    }

    /// @notice Habit missed its window — the accountability partner claims the pot.
    function claimForfeit(uint256 id) external {
        Pool storage p = pools[id];
        if (p.ptype != PoolType.Habit) revert WrongType();
        if (p.status != Status.Open) revert NotOpen();
        if (msg.sender != p.counter) revert NotBeneficiary();
        if (block.timestamp <= p.lastCheckInAt + HABIT_MAX_INTERVAL) revert TooEarly();

        p.status = Status.Forfeited;
        totalSettledEver += p.pot;
        claimable[p.counter] += p.pot;
        emit Forfeited(id, p.counter, p.pot);
    }

    /// @notice Creator cancels before anything happens. Everyone is refunded.
    function cancel(uint256 id) external {
        Pool storage p = pools[id];
        if (p.createdAt == 0) revert NotFound();
        if (p.status != Status.Open) revert NotOpen();
        if (msg.sender != p.creator) revert NotCreator();

        if (p.ptype == PoolType.Event) {
            if (p.checkedInCount > 0 || block.timestamp >= p.deadline) revert NotAllowed();
        } else if (p.ptype == PoolType.Bet) {
            if (p.joinedCount > 1) revert NotAllowed();
        } else {
            if (p.doneCheckIns > 0) revert NotAllowed();
        }

        p.status = Status.Cancelled;
        address[] storage ps = _participants[id];
        for (uint256 i = 0; i < ps.length; i++) {
            claimable[ps[i]] += p.stake;
        }
        emit Cancelled(id);
    }

    // -------------------------------------------------------------- payouts

    /// @notice Pull your winnings/refunds out.
    function withdraw() external nonReentrant {
        uint256 amount = claimable[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        claimable[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(msg.sender, amount);
    }

    // ---------------------------------------------------------------- views

    function getParticipants(uint256 id) external view returns (address[] memory) {
        return _participants[id];
    }

    /// @notice Seconds until a habit's current window opens/closes (for UI countdowns).
    function habitWindow(uint256 id) external view returns (uint40 opensAt, uint40 closesAt) {
        Pool storage p = pools[id];
        return (p.lastCheckInAt + uint40(HABIT_MIN_INTERVAL), p.lastCheckInAt + uint40(HABIT_MAX_INTERVAL));
    }
}
