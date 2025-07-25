import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Button, Dimensions, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

const BugSmasher = ({ navigation }) => {
  const [score, setScore] = useState(0);
  const [bugs, setBugs] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);

  useEffect(() => {
    if (isGameStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setGameOver(true);
    }
  }, [isGameStarted, timeLeft]);

  useEffect(() => {
    if (isGameStarted && timeLeft > 0) {
      const interval = setInterval(() => {
        setBugs((prevBugs) => [...prevBugs, createBug()]);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isGameStarted, timeLeft]);

  const createBug = () => ({
    id: Math.random().toString(),
    x: Math.random() * (width - 50),
    y: Math.random() * (height - 450) + 120,
  });

  const smashBug = (id) => {
    setBugs((prevBugs) => prevBugs.filter((bug) => bug.id !== id));
    setScore((prevScore) => prevScore + 1);
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setBugs([]);
    setGameOver(false);
    setIsGameStarted(true);
  };

  const restartGame = () => {
    setIsGameStarted(false);
  };

  return (
    <View style={styles.container}>
      {!isGameStarted ? (
        <View style={styles.startContainer}>
          <Text style={styles.title}>🐞 Bug Smasher 🐞</Text>
          <Button title="게임 시작" onPress={startGame} />
        </View>
      ) : gameOver ? (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverText}>Game Over</Text>
          <Text style={styles.finalScore}>최종 점수: {score}</Text>
          <Button title="다시 시작" onPress={restartGame} />
        </View>
      ) : (
        <>
          <Text style={styles.score}>점수: {score}</Text>
          <Text style={styles.timer}>남은 시간: {timeLeft}s</Text>
          {bugs.map((bug) => (
            <Pressable
              key={bug.id}
              onPress={() => smashBug(bug.id)}
              style={[styles.bug, { top: bug.y, left: bug.x }]}
            >
              <Text style={styles.bugText}>🐞</Text>
            </Pressable>
          ))}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  startContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  score: {
    fontSize: 24,
    fontWeight: "bold",
    position: "absolute",
    top: 50,
  },
  timer: {
    fontSize: 18,
    position: "absolute",
    top: 80,
  },
  bug: {
    position: "absolute",
  },
  bugText: {
    fontSize: 30,
  },
  gameOverContainer: {
    alignItems: "center",
  },
  gameOverText: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 10,
  },
  finalScore: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});

export default BugSmasher;
