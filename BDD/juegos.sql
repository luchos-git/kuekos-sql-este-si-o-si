-- base de datos y tabla para CRUDo juegos
-- importar desde phpMyAdmin (pestaña "Importar") o con: mysql -u root < juegos.sql

CREATE DATABASE IF NOT EXISTS `crudo_juegos`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_spanish_ci;

USE `crudo_juegos`;

--
-- Estructura de tabla para la tabla `juegos`
--

CREATE TABLE IF NOT EXISTS `juegos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(100) NOT NULL,
  `genero` varchar(50) NOT NULL,
  `consola` varchar(50) NOT NULL,
  `imagen` varchar(500) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;


-- Si la tabla ya existía sin la columna imagen, ejecutar:
-- ALTER TABLE `juegos` ADD COLUMN `imagen` varchar(500) NOT NULL DEFAULT '';
